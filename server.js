const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { SessionsClient } = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const path = require("path");
const busboy = require('busboy');
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require('bcryptjs');
const validator = require('validator');


// Enhanced CORS configuration to allow your website to connect
app.use(cors({
    origin: '*', // In production, specify your domain instead of '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

 // Replace with your Dialogflow Project ID

// SQLite Database Setup
const db = new sqlite3.Database('database.db');
// Updated inventory table to include image
db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    stock INTEGER,
    unit TEXT,
    category TEXT,
    image BLOB
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT NOT NULL
)`);

// Validation functions

db.run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total_amount REAL
)`);

// File upload handling middleware
const handleFileUpload = (req, res, next) => {
    if (!req.is('multipart/form-data')) {
        return next();
    }
    
    const bb = busboy({ headers: req.headers });
    req.body = {};
    req.file = null;
    
    // Handle file uploads
    bb.on('file', (name, file, info) => {
        const chunks = [];
        file.on('data', (data) => {
            chunks.push(data);
        });
        
        file.on('end', () => {
            req.file = Buffer.concat(chunks);
        });
    });
    
    // Handle form fields
    bb.on('field', (name, val) => {
        req.body[name] = val;
    });
    
    // Finish processing the form
    bb.on('close', () => {
        next();
    });
    
    req.pipe(bb);
};

// Dialogflow Intent Detection
// async function detectIntent(text, sessionId) {
//   // Use existing session ID if available
//   if (!sessions[sessionId]) {
//     sessions[sessionId] = uuid.v4();
//   }
  
//   const sessionPath = sessionClient.projectAgentSessionPath(
//     "freshcart-g9jc", 
//     sessions[sessionId]
//   );
  
//   const request = {
//     session: sessionPath,
//     queryInput: {
//       text: {
//         text: text,
//         languageCode: "en",
//       },
//     },
//   };
  
//   const responses = await sessionClient.detectIntent(request);
//   return responses[0].queryResult.fulfillmentText;
// }


// async function detectIntent(sessionId, queryText) {
//     const sessionClient = new dialogflow.SessionsClient();
//     const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
//     const CREDENTIALS = path.join(__dirname, "freshcart-g9jc-2da75aead80e.json"); // Replace with your key file
//     process.env.GOOGLE_APPLICATION_CREDENTIALS = CREDENTIALS;

//     const projectId = "freshcart-g9jc";

//     const request = {
//         session: sessionPath,
//         queryInput: {
//             text: {
//                 text: queryText,
//                 languageCode: "en",
//             },
//         },
//     };

//     const responses = await sessionClient.detectIntent(request);
//     return responses[0].queryResult.fulfillmentText;
// }

// app.post("/chat", async (req, res) => {
//     const { message } = req.body;
//     const sessionId = uuid.v4();

//     // try {
//     const responseText = await detectIntent(sessionId, message);
//     res.json({ reply: responseText });
//     // } catch (error) {
//     //     console.error("Dialogflow Error:", error);
//     //     res.status(500).json({ error: "Error connecting to chatbot" });
//     // }
// });


// Serve images from the database
app.get("/image/:id", (req, res) => {
    db.get("SELECT image FROM inventory WHERE id = ?", req.params.id, (err, row) => {
        if (err || !row || !row.image) {
            return res.status(404).send("Image not found");
        }
        
        res.contentType('image/jpeg');
        res.send(Buffer.from(row.image));
    });
});



// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inventory Management Routes with Image Upload
app.post("/addProduct", handleFileUpload, (req, res) => {
    setTimeout(() => {
        const { name, price, stock, unit, category } = req.body;
        const image = req.file || null;
        
        db.run("INSERT INTO inventory (name, price, stock, unit, category, image) VALUES (?, ?, ?, ?, ?, ?)", 
               [name, price, stock, unit, category, image], 
               function(err) {
                   if (err) {
                       return res.status(500).json({ error: err.message });
                   }
                   
                   res.json({ 
                       message: "Product added!",
                       product: {
                           id: this.lastID,
                           name, price, stock, unit, category,
                           imageUrl: image ? `/image/${this.lastID}` : null
                       }
                   });
               });
    }, 100);
});

app.get("/getInventory", (req, res) => {
    db.all("SELECT id, name, price, stock, unit, category, (image IS NOT NULL) as hasImage FROM inventory", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        rows.forEach(row => {
            row.image = row.hasImage ? `/image/${row.id}` : null;
            delete row.hasImage;
        });
        
        res.json(rows);
    });
});

// Updated registration route to include address field
app.post("/register", (req, res) => {
    // Log to debug
    console.log("Received data:", req.body);  // ✅ Check if request data is coming in

    const { name, username, email, address, password } = req.body;

    // Check if any field is missing
    if (!name || !username || !email || !address || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check if username or email already exists
    const checkQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
    db.get(checkQuery, [username, email], (err, row) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (row) {
            return res.status(400).json({ message: "Username or Email already exists" });
        }

        // Hash password for security
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Hashing error:", err);
                return res.status(500).json({ message: "Error hashing password" });
            }

            // Insert new user with address
            const insertQuery = `INSERT INTO users (name, username, email, password, address) VALUES (?, ?, ?, ?, ?)`;
            db.run(insertQuery, [name, username, email, hashedPassword, address], function (err) {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ message: "Error inserting user: " + err.message });
                }
                res.status(201).json({ message: "User registered successfully" });
            });
        });
    });
});

// Fix the login route response
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Username!" });
        }

        // Compare password
        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ success: false, message: "Invalid Password!" });
            }
            
            res.json({ success: true, message: "Login successful!" });
        } catch (error) {
            console.error("Password comparison error:", error);
            res.status(500).json({ success: false, message: "Authentication error" });
        }
    });
});


app.get("/getBills", (req, res) => {
    db.all("SELECT * FROM bills", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.delete("/deleteProduct/:id", (req, res) => {
    db.run("DELETE FROM inventory WHERE id=?", req.params.id, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Deleted!" });
    });
});

app.put("/updateProduct/:id", handleFileUpload, (req, res) => {
    setTimeout(() => {
        const { name, price, stock, unit, category } = req.body;
        
        if (req.file) {
            const image = req.file;
            
            db.run("UPDATE inventory SET name=?, price=?, stock=?, unit=?, category=?, image=? WHERE id=?", 
                   [name, price, stock, unit, category, image, req.params.id], 
                   (err) => {
                       if (err) {
                           return res.status(500).json({ error: err.message });
                       }
                       res.json({ 
                           message: "Updated!",
                           imageUrl: `/image/${req.params.id}`
                       });
                   });
        } else {
            db.run("UPDATE inventory SET name=?, price=?, stock=?, unit=?, category=? WHERE id=?", 
                   [name, price, stock, unit, category, req.params.id], 
                   (err) => {
                       if (err) {
                           return res.status(500).json({ error: err.message });
                       }
                       res.json({ message: "Updated!" });
                   });
        }
    }, 100);
});

// Improved Dialogflow Chat Route with session management
// app.post("/chat", async (req, res) => {
//   const { message, sessionId } = req.body;
  
//   // Use provided sessionId or create a new one
//   const activeSessionId = sessionId || uuid.v4();
  
//   try {
//     const response = await detectIntent(message, activeSessionId);
    
//     // Check if response includes inventory queries
//     if (response.includes("[INVENTORY_QUERY]")) {
//       // Example of integrating chatbot with database
//       const results = await new Promise((resolve, reject) => {
//         db.all("SELECT * FROM inventory", (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows);
//         });
//       });
      
//       // Format inventory data for the chatbot response
//       const formattedResults = results.map(item => 
//         `${item.name}: $${item.price} (${item.stock} ${item.unit} in stock)`
//       ).join('\n');
      
//       res.json({ 
//         reply: response.replace("[INVENTORY_QUERY]", formattedResults),
//         sessionId: activeSessionId
//       });
//     } else {
//       res.json({ 
//         reply: response,
//         sessionId: activeSessionId 
//       });
//     }
//   } catch (error) {
//     console.error("Error with Dialogflow:", error);
//     res.status(500).json({ 
//       reply: "I'm sorry, I'm having trouble processing your request right now.",
//       sessionId: activeSessionId
//     });
//   }
// });


app.get("/products", (req, res) => {
  const category = req.query.category;

  if (!category) {
      return res.status(400).json({ error: "Category is required" });
  }

  const sql = "SELECT * FROM inventory WHERE category = ?";
  db.all(sql, [category], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      // Convert BLOB image data to Base64 format
      const products = rows.map(row => ({
          id: row.id,
          name: row.name,
          price: row.price,
          stock: row.stock,
          unit: row.unit,
          category: row.category,
          image: row.image ? Buffer.from(row.image).toString("base64") : null
      }));

      res.json(products);
  });
});




// Start Server
// Add this to your server.js or index.js file
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
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
// SQLite Database Setup
const db = new sqlite3.Database("database.db");

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

function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table created or already exists.');
        }
    });
}

// Validation functions
function validateRegistrationInput(fullName, username, email, password) {
    // Validate full name
    if (!fullName || fullName.length < 2) {
        return 'Full name must be at least 2 characters long';
    }

    // Validate username
    if (!username || username.length < 3) {
        return 'Username must be at least 3 characters long';
    }

    // Validate email
    if (!validator.isEmail(email)) {
        return 'Invalid email address';
    }

    // Validate password
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters long';
    }

    return null;
}


db.run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total_amount REAL
)`);

// Store session IDs to maintain conversation context
const sessions = {};

// Dialogflow Setup
const sessionClient = new SessionsClient({
  keyFilename: "freshcart-g9jc-bd51e18b75a7.json", // Replace with your Google Service Account Key
});

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
async function detectIntent(text, sessionId) {
  // Use existing session ID if available
  if (!sessions[sessionId]) {
    sessions[sessionId] = uuid.v4();
  }
  
  const sessionPath = sessionClient.projectAgentSessionPath(
    "freshcart-g9jc", 
    sessions[sessionId]
  );
  
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: text,
        languageCode: "en",
      },
    },
  };
  
  const responses = await sessionClient.detectIntent(request);
  return responses[0].queryResult.fulfillmentText;
}

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
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;
  
  // Use provided sessionId or create a new one
  const activeSessionId = sessionId || uuid.v4();
  
  try {
    const response = await detectIntent(message, activeSessionId);
    
    // Check if response includes inventory queries
    if (response.includes("[INVENTORY_QUERY]")) {
      // Example of integrating chatbot with database
      const results = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM inventory", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      // Format inventory data for the chatbot response
      const formattedResults = results.map(item => 
        `${item.name}: $${item.price} (${item.stock} ${item.unit} in stock)`
      ).join('\n');
      
      res.json({ 
        reply: response.replace("[INVENTORY_QUERY]", formattedResults),
        sessionId: activeSessionId
      });
    } else {
      res.json({ 
        reply: response,
        sessionId: activeSessionId 
      });
    }
  } catch (error) {
    console.error("Error with Dialogflow:", error);
    res.status(500).json({ 
      reply: "I'm sorry, I'm having trouble processing your request right now.",
      sessionId: activeSessionId
    });
  }
});


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
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
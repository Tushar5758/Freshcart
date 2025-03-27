const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fs = require("fs");
const busboy = require('busboy');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database("database.db");

// Create tables without storing mimetype

 db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    stock INTEGER,
    unit TEXT,
    category TEXT,
    image BLOB
)`);

db.run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total_amount REAL
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    house_no TEXT,
    street_details TEXT,
    city_district TEXT NOT NULL
)`);

// User Registration Function
function registerUser(fullName, email, password, houseNo, streetDetails, cityDistrict) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users 
            (full_name, email, password, house_no, street_details, city_district) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [fullName, email, password, houseNo, streetDetails, cityDistrict],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}


// Password hashing function
function hashPassword(password) {
    // Using SHA-256 for password hashing
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Updated User Registration Function
function registerUser(fullName, email, password, houseNo, streetDetails, cityDistrict) {
    return new Promise((resolve, reject) => {
        // Hash the password before storing
        const hashedPassword = hashPassword(password);
        
        db.run(
            `INSERT INTO users 
            (full_name, email, password, house_no, street_details, city_district) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [fullName, email, hashedPassword, houseNo, streetDetails, cityDistrict],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

// Update the registration route to use hashing
app.post("/register", (req, res) => {
    const { fullName, email, password, houseNo, streetDetails, cityDistrict } = req.body;
    
    // Basic validation
    if (!fullName || !email || !password || !cityDistrict) {
        return res.status(400).json({ 
            message: "Missing required fields" 
        });
    }
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            message: "Invalid email format" 
        });
    }
    
    // Password strength check
    if (password.length < 8) {
        return res.status(400).json({ 
            message: "Password must be at least 8 characters long" 
        });
    }
    
    registerUser(fullName, email, password, houseNo, streetDetails, cityDistrict)
        .then(userId => {
            res.status(201).json({ 
                message: "User registered successfully", 
                userId: userId 
            });
        })
        .catch(err => {
            if (err.message.includes("UNIQUE constraint failed")) {
                res.status(409).json({ 
                    message: "Email already registered" 
                });
            } else {
                res.status(500).json({ 
                    message: "Error registering user", 
                    error: err.message 
                });
            }
        });
});

// You might also want to add a registration route to use this function
app.post("/register", (req, res) => {
    const { fullName, email, password, houseNo, streetDetails, cityDistrict } = req.body;
    
    // TODO: Add password hashing before storing
    registerUser(fullName, email, password, houseNo, streetDetails, cityDistrict)
        .then(userId => {
            res.status(201).json({ 
                message: "User registered successfully", 
                userId: userId 
            });
        })
        .catch(err => {
            res.status(500).json({ 
                message: "Error registering user", 
                error: err.message 
            });
        });
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

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

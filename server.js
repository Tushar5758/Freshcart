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

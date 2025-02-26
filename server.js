const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("grocery.db");


db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    stock INTEGER,
    unit TEXT,
    category TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total_amount REAL
)`);


app.post("/addProduct", (req, res) => {
    const { name, price, stock, unit, category } = req.body;
    db.run("INSERT INTO inventory (name, price, stock, unit, category) VALUES (?, ?, ?, ?, ?)", 
           [name, price, stock, unit, category], 
           () => res.send({ message: "Product added!" }));
});

app.get("/getInventory", (req, res) => {
    db.all("SELECT * FROM inventory", (err, rows) => res.json(rows));
});

app.get("/getBills", (req, res) => {
    db.all("SELECT * FROM bills", (err, rows) => res.json(rows));
});

app.delete("/deleteProduct/:id", (req, res) => {
    db.run("DELETE FROM inventory WHERE id = ?", req.params.id, () => res.send({ message: "Deleted!" }));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

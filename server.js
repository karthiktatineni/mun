const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = "munadmin"; // change this

app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


const DATA_FILE = "./public/registrations.json";
const EXPORT_DIR = "exports";

// Ensure files/folders exist
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);

// Register API
app.post("/register", (req, res) => {
  const registrations = JSON.parse(fs.readFileSync(DATA_FILE));
  registrations.push(req.body);
  fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2));
  res.json({ message: "Registration Successful!" });
});

// Admin: get all registrations
app.post("/admin/data", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const registrations = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(registrations);
});

// Export to Excel
app.post("/admin/export", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  const filePath = path.join(EXPORT_DIR, "registrations.xlsx");
  XLSX.writeFile(workbook, filePath);

  res.json({ message: "Excel exported successfully!" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

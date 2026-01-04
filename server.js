const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = "munadmin";

app.use(express.json()); // parse JSON

const DATA_FILE = path.join(__dirname, "public", "registrations.json");
const EXPORT_DIR = path.join(__dirname, "exports");


// Ensure files/folders exist
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);

// ------------------- API ROUTES -------------------

// 1️⃣ Registration
app.post("/register", (req, res) => {
  const registrations = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const referenceId = "MUNIARE_" + Math.floor(100000 + Math.random() * 900000);

  const newRegistration = {
    ...req.body,
    referenceId,
    payment: { utr: "", status: "PENDING", verified: false, verifiedAt: null },
    createdAt: new Date().toISOString()
  };

  registrations.push(newRegistration);
  fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2));
  res.json({ success: true, referenceId });
});

// 2️⃣ Payment
app.post("/payment", (req, res) => {
  try {
    const { referenceId, utr } = req.body;
    if (!referenceId || !utr) {
      return res.status(400).json({ success: false, message: "Reference ID or UTR missing" });
    }

    // Load registrations
    const registrations = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const entry = registrations.find(r => r.referenceId === referenceId);
    if (!entry) return res.status(404).json({ success: false, message: "Registration not found" });

    // Update payment info
    entry.payment.utr = utr;
    entry.payment.status = "PAID";
    entry.payment.paidAt = new Date().toISOString();

    fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2));

    // Return registration info
    res.json({ success: true, registration: { name: entry.name, phone: entry.phone } });
  } catch (err) {
    console.error("Payment route error:", err);
    res.status(500).json({ success: false, message: "Server error during payment" });
  }
});


// 3️⃣ Admin data
app.post("/admin/data", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const registrations = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  res.json(registrations);
});

// 4️⃣ Export Excel
app.post("/admin/export", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  const formatted = data.map(r => ({
    Name: r.name,
    Email: r.email,
    Phone: r.phone,
    College: r.college,
    MUNs: r.muns,
    ReferenceID: r.referenceId,
    PaymentStatus: r.payment.status,
    Verified: r.payment.verified ? "YES" : "NO",
    UTR: r.payment.utr,
    Committees: r.allocation ? r.allocation.map(a => `${a.committee}: ${a.countries.join(", ")}`).join(" | ") : ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  const filePath = path.join(EXPORT_DIR, "registrations.xlsx");
  XLSX.writeFile(workbook, filePath);
  res.json({ success: true, message: "Excel exported successfully!" });
});

// 5️⃣ Verify payment
app.post("/payments/verify", (req, res) => {
  try {
    const { referenceId } = req.body;
    if (!referenceId) return res.status(400).json({ error: "Missing Reference ID" });

    const registrations = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const entry = registrations.find(r => r.referenceId === referenceId);
    if (!entry) return res.status(404).json({ error: "Reference ID not found" });

    entry.payment.verified = true;
    entry.payment.verifiedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2));

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error verifying payment" });
  }
});
app.get("/public-allocations", (req, res) => {
  res.sendFile(path.join(__dirname, "allocations.json"));
});




app.get("/country-matrix-json", (req, res) => {
  const registrations = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  // Gather allocations
  const matrix = [];

  registrations.forEach(delegate => {
    if (!delegate.allocation) return;
    delegate.allocation.forEach(a => {
      a.countries.forEach(country => {
        matrix.push({
          Committee: a.committee,
          Country: country,
          Delegate: delegate.name
        });
      });
    });
  });

  // Generate HTML
  let html = `
    <html>
    <head>
      <title>Country Matrix</title>
      <style>
        body { font-family: Arial; background:#0b0b0b; color:#fff; }
        table { border-collapse: collapse; width:100%; margin-top:20px; }
        th, td { border:1px solid #444; padding:8px; text-align:left; }
        th { background:#D4AF37; color:#000; }
        tr:nth-child(even) { background:#1a1a1a; }
      </style>
    </head>
    <body>
      <h2>Country Matrix - MUN IARE</h2>
      <table>
        <tr>
          <th>Committee</th>
          <th>Country</th>
          <th>Delegate</th>
        </tr>
  `;

  matrix.forEach(row => {
    html += `<tr>
      <td>${row.Committee}</td>
      <td>${row.Country}</td>
      <td>${row.Delegate}</td>
    </tr>`;
  });

  html += `
      </table>
    </body>
    </html>
  `;

  res.send(html);
});


// ------------------- Static files -------------------
app.use(express.static("public")); // static files last

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

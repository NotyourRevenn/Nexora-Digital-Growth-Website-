/**
 * NEXORA DIGITAL - EXPRESS.JS BACKEND RUNTIME
 * Alternative Node.js runtime for production deployment on Render / Railway / Heroku
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Website
app.use(express.static(path.join(__dirname)));

// Route alias for Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(` 🚀 Nexora Digital Express Server running on port ${PORT}`);
  console.log(` 🌐 Website: http://localhost:${PORT}/`);
  console.log(` 🔐 Admin:   http://localhost:${PORT}/admin`);
  console.log(`=============================================================\n`);
});

const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const port = 8000;

// Enable CORS
app.use(cors());

// Serve static files from the current directory
app.use(express.static("./"));

// Add a route to run the Python script on demand
app.get("/api/update-portfolio-data", (req, res) => {
  console.log("Running portfolio analysis...");

  exec("python portfolio_analyzer.py", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running Python script: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    console.log(`Python script output: ${stdout}`);
    console.log("Portfolio data has been updated.");

    res.json({ success: true, message: "Portfolio data updated successfully" });
  });
});

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Run Python script when server starts
console.log("Running initial portfolio analysis...");
exec("python portfolio_analyzer.py", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running Python script: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Python script stderr: ${stderr}`);
  }
  console.log(`Python script output: ${stdout}`);
  console.log("Initial portfolio data has been generated.");

  // Start server after Python script completes
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Visit http://localhost:${port} in your browser`);
  });
});

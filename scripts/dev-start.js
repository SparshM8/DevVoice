#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

function log(label, message) {
  console.log(`\x1b[36m[${label}]\x1b[0m ${message}`);
}

function success(message) {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);
}

function warn(message) {
  console.log(`\x1b[33m⚠ ${message}\x1b[0m`);
}

log("STARTUP", "DevVoice development environment");

// Check environment
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  warn("No .env.local found. Running in MOCK_MODE.");
  fs.copyFileSync(path.join(__dirname, "..", ".env.example"), envPath);
  log("ENV", "Created .env.local from example");
}

// Parse environment
const envContent = fs.readFileSync(envPath, "utf-8");
const isMockMode = !envContent.includes("OPENAI_API_KEY=") ||
  envContent.match(/OPENAI_API_KEY=\s*$/m);
const isQdrantConfigured = envContent.includes("QDRANT_URL=") &&
  !envContent.match(/QDRANT_URL=\s*$/m);

log("CONFIG", `Mock Mode: ${isMockMode ? "ON" : "OFF"}`);
log("CONFIG", `Qdrant: ${isQdrantConfigured ? "CONFIGURED" : "USING LOCAL STORE"}`);

if (isMockMode) {
  success("Running in mock mode. All APIs have intelligent fallbacks.");
  log("DEMO", "Try these prompts on http://localhost:3000/dashboard:");
  console.log("  • Why does my React useEffect keep re-rendering?");
  console.log("  • Help me debug this stack trace: ...");
  console.log("  • What does EADDRINUSE mean and how do I fix it?");
}

if (isQdrantConfigured) {
  success("Qdrant is configured. Vector store ready.");
} else {
  warn("Qdrant not configured. Using in-memory vector store.");
  log("HINT", "Add QDRANT_URL and QDRANT_API_KEY to .env.local for remote storage");
}

log("ROUTES", "API endpoints ready:");
console.log("  • POST  /api/chat       - Send chat message");
console.log("  • POST  /api/upload     - Upload docs/code/logs");
console.log("  • GET   /api/history    - View session history");
console.log("  • POST  /api/seed       - Load demo context");

log("UI", "Pages ready:");
console.log("  • http://localhost:3000/              - Landing");
console.log("  • http://localhost:3000/dashboard     - Voice console");
console.log("  • http://localhost:3000/knowledge     - Upload KB");
console.log("  • http://localhost:3000/history       - Sessions");
console.log("  • http://localhost:3000/demo          - Demo flow");

log("NEXT", "Starting Next.js dev server...\n");

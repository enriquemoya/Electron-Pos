/**
 * Memory Bank Update Script (Enhanced)
 * ------------------------------------
 * Usage:
 *   npm run memory:update "Short description of change"
 *
 * Responsibilities:
 * - Enforces Memory Bank discipline
 * - Appends structured entries to progress.md
 * - Updates activeContext.md with latest focus
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MEMORY_DIR = path.join(ROOT, ".memory-bank");

const progressFile = path.join(MEMORY_DIR, "progress.md");
const activeContextFile = path.join(MEMORY_DIR, "activeContext.md");

function ensureFile(filePath, initialContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, initialContent, "utf8");
  }
}

function getMessageFromArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    return "Memory bank updated (no description provided)";
  }
  return args.join(" ");
}

function appendProgressEntry(message) {
  const date = new Date().toISOString().split("T")[0];

  const entry = `
## ${date}
- ${message}
`;

  fs.appendFileSync(progressFile, entry, "utf8");
}

function updateActiveContext(message) {
  const date = new Date().toISOString();
  const content = `# Active Context

Last updated: ${date}

Current focus:
- ${message}
`;

  fs.writeFileSync(activeContextFile, content, "utf8");
}

function run() {
  if (!fs.existsSync(MEMORY_DIR)) {
    console.error("❌ .memory-bank directory not found.");
    process.exit(1);
  }

  ensureFile(progressFile, "# Project Progress\n\n");
  ensureFile(activeContextFile, "# Active Context\n\n");

  const message = getMessageFromArgs();

  appendProgressEntry(message);
  updateActiveContext(message);

  console.log("✅ Memory Bank updated successfully.");
  console.log(`🧠 Context: ${message}`);
}

run();

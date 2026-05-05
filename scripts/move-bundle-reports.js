const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", ".next", "analyze");
const dest = path.join(__dirname, "..", "bundle-reports");

fs.mkdirSync(dest, { recursive: true });

for (const file of fs.readdirSync(src)) {
  if (file.endsWith(".html")) {
    fs.renameSync(path.join(src, file), path.join(dest, file));
    console.log(`  moved → bundle-reports/${file}`);
  }
}

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === ".git") continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(filePath));
    } else if (filePath.endsWith(".js") && !filePath.endsWith("audit_backend.js")) {
      results.push(filePath);
    }
  }
  return results;
}

async function audit() {
  const files = getAllJsFiles(backendDir);
  console.log(`Found ${files.length} backend JS files to audit.\n`);

  let pass = 0;
  let fail = 0;
  const errors = [];

  for (const file of files) {
    const relative = path.relative(backendDir, file);
    try {
      const fileUrl = pathToFileURL(file).href;
      await import(fileUrl);
      console.log(`✓ OK: ${relative}`);
      pass++;
    } catch (err) {
      console.error(`✗ FAIL: ${relative}`);
      console.error(`  Error: ${err.stack || err.message}\n`);
      fail++;
      errors.push({ file: relative, error: err.message, stack: err.stack });
    }
  }

  console.log(`\n========================================`);
  console.log(`AUDIT RESULTS: ${pass} passed, ${fail} failed out of ${files.length} files.`);
  console.log(`========================================\n`);

  if (errors.length > 0) {
    console.log("ERRORS SUMMARY:");
    errors.forEach((e) => {
      console.log(`- ${e.file}: ${e.error}`);
    });
  }
}

audit();

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8"));
const zh = JSON.parse(fs.readFileSync(path.join(root, "messages/zh.json"), "utf8"));

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx"))) {
      files.push(full);
    }
  }
  return files;
}

const sources = walk(srcDir);
const issues = [];

for (const file of sources) {
  const content = fs.readFileSync(file, "utf8");
  const nsMap = new Map();
  const nsRegex = /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:getTranslations|useTranslations)\("([^"]+)"\)/g;
  let m;
  while ((m = nsRegex.exec(content)) !== null) {
    nsMap.set(m[1], m[2]);
  }

  for (const [fnName, ns] of nsMap.entries()) {
    const keyRegex = new RegExp(`\\b${fnName}\\("([^"]+)"\\)`, "g");
    let k;
    while ((k = keyRegex.exec(content)) !== null) {
      const key = k[1];
      if (!en?.[ns] || en[ns][key] === undefined) {
        issues.push(`[en] ${path.relative(root, file)} -> ${ns}.${key}`);
      }
      if (!zh?.[ns] || zh[ns][key] === undefined) {
        issues.push(`[zh] ${path.relative(root, file)} -> ${ns}.${key}`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error("Missing i18n keys:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("i18n key check passed.");

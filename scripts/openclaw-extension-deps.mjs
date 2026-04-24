import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";

const builtins = new Set(
  builtinModules.flatMap((m) => [m, `node:${m}`]),
);

const appData = process.env.APPDATA ?? "";
const root = path.join(
  appData,
  "npm",
  "node_modules",
  "openclaw",
  "dist",
  "extensions",
);

function pkgName(spec) {
  if (!spec) return;
  if (spec.startsWith(".") || spec.startsWith("openclaw/")) return;
  if (spec.startsWith("node:") || builtins.has(spec)) return;
  if (spec.startsWith("@")) {
    const parts = spec.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return;
  }
  const i = spec.indexOf("/");
  if (i !== -1) return spec.slice(0, i);
  if (builtins.has(spec)) return;
  return spec;
}

const pkgs = new Set();

function scanFile(filePath) {
  let c;
  try {
    c = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  for (const line of c.split(/\r?\n/)) {
    const t = line.trimStart();
    if (t.startsWith("import") || t.startsWith("export")) {
      const fm = line.match(/\bfrom\s+["']([^"']+)["']/);
      if (fm) pkgs.add(pkgName(fm[1]));
      const dm = line.match(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/);
      if (dm) pkgs.add(pkgName(dm[1]));
    }
    if (/^\s*(?:const|let|var)\s/.test(line) && line.includes("require(")) {
      const rm = line.match(/require\s*\(\s*["']([^"']+)["']\s*\)/);
      if (rm) pkgs.add(pkgName(rm[1]));
    }
  }
}

/** Rollup emits many top-level chunks per extension; stay non-recursive to avoid vendor noise. */
function scanExtensionTopLevelJs(extDir) {
  let ents;
  try {
    ents = fs.readdirSync(extDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    if (!e.isFile() || !e.name.endsWith(".js")) continue;
    scanFile(path.join(extDir, e.name));
  }
}

if (!fs.existsSync(root)) {
  console.error("extensions dir not found:", root);
  process.exit(1);
}

const extDirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "node_modules")
  .map((d) => path.join(root, d.name));

for (const extDir of extDirs) {
  scanExtensionTopLevelJs(extDir);
}

const list = [...pkgs].filter(Boolean).sort();
console.log(list.join(" "));

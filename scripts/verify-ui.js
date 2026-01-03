const fs = require("fs");
const path = require("path");

const uiRoot = path.join(
  __dirname,
  "..",
  "MiNegocioApp_UI",
  "MiNegocioApp_UI"
);

const htmlFiles = fs
  .readdirSync(uiRoot)
  .filter((file) => file.toLowerCase().endsWith(".html"))
  .map((file) => path.join(uiRoot, file));

const idRegex = /id=["']([^"']+)["']/g;
const foundIds = new Set();

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    foundIds.add(match[1]);
  }
}

const requiredIds = [
  "loginForm",
  "loginButton",
  "registerForm",
  "registerButton",
  "email",
  "password",
  "password_confirm",
  "business_name",
  "tablaCitas",
  "btnNuevaCita",
  "tablaCatalogo",
  "tablaCarrito",
  "total",
  "btnCobrar",
  "mRecibido",
  "mCambio",
];

const missing = requiredIds.filter((id) => !foundIds.has(id));

if (missing.length) {
  console.error("Missing required UI IDs:", missing.join(", "));
  process.exit(1);
}

console.log("UI ID sanity check passed.");

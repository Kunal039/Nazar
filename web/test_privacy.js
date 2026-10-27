// Privacy guards for the page: fails if a change could keep, send or track call content.
const fs = require("fs");
const app = fs.readFileSync(__dirname + "/app.js", "utf8");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
let fail = 0;
function ok(name, cond) { if (!cond) { fail++; console.log("FAIL", name); } else console.log("ok  ", name); }
const body = (fn) => { const i = app.indexOf("function " + fn + "("); let d = 0, j = app.indexOf("{", i); const s = j; do { if (app[j] === "{") d++; else if (app[j] === "}") d--; j++; } while (d); return app.slice(s, j); };

ok("call text is forgotten after 30 seconds", /MEMORY_MS = 30000/.test(app) && /setInterval\(\(\) => forgetLines\(MEMORY_MS\)/.test(app));
ok("Stop wipes all call text", /forgetLines\(0\)/.test(body("stopListening")));
ok("family alert never includes call text", !/session|lines|transcript|text/.test(body("familyText").replace(/textContent/g, "")));
ok("no tracking or analytics code", !/google-analytics|gtag\(|googletagmanager|mixpanel|segment\.com|hotjar|facebook\.net|clarity\.ms/i.test(app + html));
const urls = [...app.matchAll(/fetch\(\s*["'`]([^"'`]+)/g)].map((m) => m[1]);
ok("the page only talks to its own server and Telegram (alerts)", urls.every((u) => u === "/health" || u.startsWith("https://api.telegram.org/") || /\.(css|js|html|json)$/.test(u)));
ok("cloud speech needs the user's consent", /confirm\(".*cloud speech/i.test(app));
console.log(fail ? `${fail} failed` : "PASS");
process.exit(fail ? 1 : 0);

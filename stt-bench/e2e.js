// End-to-end check: does the detector still work on what Whisper actually heard?
// Feeds each model's transcripts into the detector line by line, like a live call, and compares
// with the result on the original typed text.
// Usage: node e2e.js results.json [model-key-filter]
const fs = require("fs");
const path = require("path");
const { Session, THRESHOLD } = require("../nazar-prototype/detector.js");
const { CALLS } = require("../nazar-prototype/calls.js");

const res = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const flt = process.argv[3] || "";
const byId = Object.fromEntries(CALLS.map((c) => [c.id, c]));

function outcome(call, lines) {
  const s = new Session();
  let alertAt = -1;
  lines.forEach((l, i) => { s.add(l); if (alertAt < 0 && s.score().risk >= THRESHOLD) alertAt = i; });
  const r = s.score();
  if (call.kind === "scam") return alertAt < 0 ? "missed" : alertAt < call.moneyAt ? "early" : "late";
  return r.level === "danger" ? "FALSE" : r.level === "warn" ? "caution" : "safe";
}

function tally(list) {
  const scams = list.filter((x) => x.kind === "scam"), gen = list.filter((x) => x.kind === "genuine");
  const n = (arr, v) => arr.filter((x) => x.o === v).length;
  return `scams early ${n(scams, "early")}/${scams.length} late ${n(scams, "late")} missed ${n(scams, "missed")}` +
    `  |  genuine false alarm ${n(gen, "FALSE")}/${gen.length} caution ${n(gen, "caution")}`;
}

const first = Object.values(res)[0];
const groups = ["Hindi", "Hinglish", "English", "Punjabi", "Punjabi-as-hi"];
const callsIn = (g) => [...new Set(first.rows.filter((r) => r.group === g && r.cond === "clean").map((r) => r.call))];

console.log("TYPED TEXT (reference)");
for (const g of groups.slice(0, 4)) {
  const list = callsIn(g).map((id) => ({ kind: byId[id].kind, o: outcome(byId[id], byId[id].lines) }));
  console.log("  " + g.padEnd(14), tally(list));
}
const misses = [];
for (const [key, r] of Object.entries(res)) {
  if (!key.includes(flt)) continue;
  for (const cond of ["clean", "phone"]) {
    console.log(`\n${key}  [${cond}]`);
    for (const g of groups) {
      const ids = callsIn(g);
      if (!ids.length) continue;
      const list = ids.map((id) => {
        const lines = r.rows.filter((x) => x.group === g && x.cond === cond && x.call === id).sort((a, b) => a.line - b.line).map((x) => x.text);
        const o = outcome(byId[id], lines);
        if (o === "missed" || o === "FALSE" || o === "late") misses.push(`${key} ${cond} ${g} ${id}: ${o}`);
        return { kind: byId[id].kind, o };
      });
      console.log("  " + g.padEnd(14), tally(list));
    }
  }
}
if (process.argv.includes("--misses")) console.log("\n" + misses.join("\n"));

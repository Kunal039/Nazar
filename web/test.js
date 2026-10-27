// Runs every scripted call in calls.js through the detector and prints the results.
// node test.js   (exit code 1 if an in-scope scam is missed or a genuine call raises the full warning)
// Scams with scope "other" (lottery, fake relative, ...) are reported but do not fail the run:
// they are outside the digital-arrest pattern Nazar is built for.
const { Session, THRESHOLD } = require("./detector.js");
const { CALLS } = require("./calls.js");

function runCall(call) {
  const s = new Session();
  let alertAt = -1;
  call.lines.forEach((l, i) => { s.add(l); if (alertAt < 0 && s.score().risk >= THRESHOLD) alertAt = i; });
  return { risk: s.score().risk, level: s.score().level, alertAt, history: s.history };
}

const groups = {};
const g = (k) => (groups[k] = groups[k] || { scams: 0, caught: 0, early: 0, genuine: 0, falseAlarms: 0, warns: 0 });
const failures = [];
for (const c of CALLS) {
  const r = runCall(c);
  const key = (c.set || "v1") + (c.scope === "other" ? " other-scam" : "");
  const t = g(key), all = g("ALL in-scope");
  let verdict;
  if (c.kind === "scam") {
    for (const x of c.scope === "other" ? [t] : [t, all]) {
      x.scams++;
      if (r.alertAt >= 0) x.caught++;
      if (r.alertAt >= 0 && r.alertAt < c.moneyAt) x.early++;
    }
    verdict = r.alertAt < 0 ? "MISSED" : r.alertAt < c.moneyAt ? "caught before money ask" : "caught at money ask";
    if (r.alertAt < 0 && c.scope !== "other") failures.push(c.id);
  } else {
    for (const x of [t, all]) {
      x.genuine++;
      if (r.level === "danger") x.falseAlarms++;
      else if (r.level === "warn") x.warns++;
    }
    if (r.level === "danger") failures.push(c.id);
    verdict = r.level === "danger" ? "FALSE ALARM" : r.level === "warn" ? "caution shown" : "stayed safe";
  }
  console.log(c.id.padEnd(4), (c.set || "v1").padEnd(3), c.lang.padEnd(16), c.title.slice(0, 38).padEnd(38), r.history.join(">").padEnd(26), verdict + (c.scope === "other" ? " (other scam type)" : ""));
}

console.log("");
for (const [k, x] of Object.entries(groups)) {
  const parts = [];
  if (x.scams) parts.push(`scams caught ${x.caught}/${x.scams} (${x.early} before money ask)`);
  if (x.genuine) parts.push(`genuine: false alarms ${x.falseAlarms}/${x.genuine}, caution ${x.warns}/${x.genuine}`);
  console.log(k.padEnd(16), parts.join("  |  "));
}
console.log(failures.length ? "FAIL: " + failures.join(", ") : "PASS");
process.exit(failures.length ? 1 : 0);

// Unit tests for the risk formula in detector.js.
const { Session, THRESHOLD } = require("./detector.js");
let fail = 0;
const risk = (lines) => { const s = new Session(); lines.forEach((l) => s.add(l)); return s.score().risk; };
function ok(name, cond) { if (!cond) { fail++; console.log("FAIL", name); } else console.log("ok  ", name); }

ok("empty call is 0", risk([]) === 0);
ok("repeating a phrase does not raise risk", risk(["CBI officer calling you"]) === risk(["CBI officer calling you", "CBI officer calling you", "CBI officer calling you"]));
ok("authority + weak fear stays below the alarm", risk(["I am from CBI, you", "there is a case against you"]) < THRESHOLD);
ok("authority + strong fear (arrest warrant) reaches the alarm", risk(["I am from CBI, you", "there is an arrest warrant against you"]) >= THRESHOLD);
ok("adding isolation crosses the alarm", risk(["I am from CBI, you", "there is an arrest warrant against you", "do not tell anyone"]) >= THRESHOLD);
ok("scam order scores higher than reversed order",
  risk(["I am from CBI, you", "arrest warrant against you", "do not tell anyone"]) > risk(["do not tell anyone, you", "arrest warrant against you", "I am from CBI"]));
ok("risk never exceeds 100", risk(["CBI police you", "arrest warrant drugs", "do not tell anyone, stay on video call", "share OTP and card number", "transfer to safe account"]) <= 100);
console.log(fail ? `${fail} failed` : "PASS");
process.exit(fail ? 1 : 0);

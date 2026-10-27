// Unit tests for the "aimed at the listener" rule (G22 fix).
const { Session, THRESHOLD } = require("./detector.js");
let fail = 0;
function check(name, lines, expectAlarm) {
  const s = new Session();
  lines.forEach((l) => s.add(l));
  const alarm = s.score().risk >= THRESHOLD;
  if (alarm !== expectAlarm) { fail++; console.log("FAIL", name, s.score()); } else console.log("ok  ", name);
}
check("news report about a scam (no 'you')", ["Police arrested CBI impostors who threatened victims with arrest warrants and asked them to transfer money to a safe account."], false);
check("English threat aimed at listener", ["I am inspector from CBI.", "Your Aadhaar is linked to drugs, there is an arrest warrant against you.", "Do not tell anyone, stay on video call."], true);
check("Hindi threat aimed at listener", ["मैं सीबीआई से इंस्पेक्टर बोल रहा हूँ।", "आपके नाम पर अरेस्ट वारंट निकला है।", "किसी को मत बताना, वीडियो कॉल पर बने रहिए।"], true);
check("Punjabi (Roman) threat aimed at listener", ["Main cyber cell ton inspector bol reha haan.", "Tuhade Aadhaar te FIR hai, money laundering da case hai.", "Kise nu na dasseyo."], true);
console.log(fail ? `${fail} failed` : "PASS");
process.exit(fail ? 1 : 0);

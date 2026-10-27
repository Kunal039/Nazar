// Unit tests for the scam-awareness rule: callers who warn about scams never get the full alarm.
const { Session, THRESHOLD } = require("./detector.js");
let fail = 0;
const risk = (lines) => { const s = new Session(); lines.forEach((l) => s.add(l)); return s.score().risk; };
function ok(name, cond) { if (!cond) { fail++; console.log("FAIL", name); } else console.log("ok  ", name); }

const scam = ["I am from CBI, there is an arrest warrant against you.", "Do not tell anyone, stay on video call.", "Transfer your money to the safe account."];
ok("plain scam reaches the alarm", risk(scam) >= THRESHOLD);
ok("same words plus 'report it to 1930' stay below the alarm", risk([...scam, "If anyone says this, report it to 1930."]) < THRESHOLD);
ok("Hindi ठगी (fraud warning) caps the risk", risk(["सीबीआई के नाम पर आपको धमकी दी जाए, गिरफ्तारी वारंट बताया जाए", "किसी को मत बताना, ऐसा कहते हैं", "ये ठगी है, पैसे सेफ अकाउंट में मत डालना"]) < THRESHOLD);
ok("Punjabi ਠੱਗੀ caps the risk", risk(["ਤੁਹਾਨੂੰ ਪੁਲਿਸ ਦੇ ਨਾਂ ਤੇ ਫੋਨ ਆਵੇ ਕਿ ਗ੍ਰਿਫ਼ਤਾਰੀ ਵਾਰੰਟ ਹੈ", "ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸਿਓ ਕਹਿਣਗੇ", "ਇਹ ਠੱਗੀ ਹੈ"]) < THRESHOLD);
ok("the word 'fraud' alone does not cap (scammers say 'SIM fraud')", risk([...scam, "Your SIM was used for fraud."]) >= THRESHOLD);
ok("scammer saying 'this is not a scam' still reaches the alarm", risk(["This is not a scam call, I am from CBI.", ...scam.slice(1), "there is an arrest warrant against you"]) >= THRESHOLD);
ok("Hinglish 'ye fraud ya scam nahi hai' still reaches the alarm", risk(["Main CBI se hoon, ye koi scam nahi hai, aapke naam arrest warrant hai.", "Kisi ko mat batana, video call pe rahiye.", "Paise safe account mein transfer kijiye."]) >= THRESHOLD);
console.log(fail ? `${fail} failed` : "PASS");
process.exit(fail ? 1 : 0);

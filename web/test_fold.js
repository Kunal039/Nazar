// Unit tests for text folding and word boundaries in detector.js.
const { analyzeLine } = require("./detector.js");
let fail = 0;
const stagesOf = (t) => [...new Set(analyzeLine(t).matches.map((m) => m.stage))].sort().join(",");
function eq(name, got, want) { if (got !== want) { fail++; console.log("FAIL", name, "got", got, "want", want); } else console.log("ok  ", name); }

eq("Gurmukhi and Devanagari match the same word (police)", stagesOf("ਪੁਲਿਸ"), stagesOf("पुलिस"));
eq("nukta variants fold together (गिरफ़्तार = गिरफ्तार)", stagesOf("गिरफ़्तार"), stagesOf("गिरफ्तार"));
eq("Roman Hinglish authority word", stagesOf("main CBI se bol raha hoon"), "1");
eq("surname Gupta is not 'secret' (ਗੁਪਤ)", stagesOf("मैं गुप्ता जी बोल रहा हूँ"), "");
eq("केसर (saffron) is not केस (case)", stagesOf("केसर वाला दूध"), "");
eq("'case' inside 'verification' does not match (ਵੈਰੀਫਿਕੇਸ਼ਨ)", stagesOf("ਵੈਰੀਫਿਕੇਸ਼ਨ"), "");
eq("'bank' alone is weak authority", analyzeLine("bank").matches[0].weight, 0.25);
console.log(fail ? `${fail} failed` : "PASS");
process.exit(fail ? 1 : 0);

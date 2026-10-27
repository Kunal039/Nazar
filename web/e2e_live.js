// End-to-end check: streams a WAV call to the on-device speech server, scores each sentence
// with the detector, and reports when the alarm fires.
// Usage: node web/e2e_live.js demo-audio/S1_full.wav [--lang hi]   (server must be running)
const fs = require("fs");
const { Session, THRESHOLD } = require("./detector.js");

const file = process.argv[2];
const lang = process.argv.includes("--lang") ? process.argv[process.argv.indexOf("--lang") + 1] : "hi";
const buf = fs.readFileSync(file);
const dataAt = buf.indexOf("data") + 8;                 // 16 kHz mono 16-bit WAV
const pcm = buf.subarray(dataAt);
const tail = Buffer.alloc(32000);                       // 1 s of silence so the last sentence ends

const s = new Session();
let n = 0, alarmAt = -1;
const ws = new WebSocket(`ws://localhost:8000/ws?lang=${lang}`);
ws.binaryType = "arraybuffer";
ws.onopen = () => {
  const all = Buffer.concat([pcm, tail]);
  for (let i = 0; i < all.length; i += 8192) ws.send(all.subarray(i, i + 8192));
  setTimeout(() => ws.close(), 15000);
};
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.type !== "final" || !m.text) return;
  n++;
  s.add(m.text);
  const r = s.score();
  if (r.risk >= THRESHOLD && alarmAt < 0) alarmAt = n;
  console.log(`${n}. [${r.risk}] ${m.text}  (${m.ms} ms)`);
};
ws.onclose = () => {
  console.log(alarmAt > 0 ? `ALARM at sentence ${alarmAt}` : "no alarm");
  process.exit(0);
};

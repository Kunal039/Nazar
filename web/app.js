// Nazar prototype page: live microphone, sample calls, typed lines, alerts and test bench.
// Uses STAGES, THRESHOLD, Session (detector.js) and CALLS (calls.js).
(function () {
  const $ = (id) => document.getElementById(id);
  const session = new Session();
  let alerted = false, dismissed = false, playTimer = null, playing = false;
  const LEVEL_TXT = { safe: "Safe", warn: "Be careful", danger: "Likely scam" };
  const LEVEL_COL = { safe: "#2E7D32", warn: "#9A6B0F", danger: "#8B2E16" };

  // ---------- small helpers ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem("nazar." + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("nazar." + k, v); } catch (e) {} }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function hindiUI() { return $("lang").value !== "en-IN"; }

  // First visit: three-step tips, hidden for good once dismissed.
  if (store.get("introSeen", "") !== "1") $("intro").hidden = false;
  $("introClose").onclick = () => { $("intro").hidden = true; store.set("introSeen", "1"); };

  // Larger text for older users; remembered on this device.
  function setBig(on) { document.documentElement.classList.toggle("big", on); $("bigText").setAttribute("aria-pressed", on); store.set("big", on ? "1" : ""); }
  setBig(store.get("big", "") === "1");
  $("bigText").onclick = () => setBig(!document.documentElement.classList.contains("big"));

  // ---------- static bits ----------
  const STEP_HELP = [
    "Authority: the caller claims to be CBI, police, customs, a court or a bank.",
    "Fear: a case, arrest warrant, drugs or money laundering in your name.",
    "Isolation: don't tell anyone, stay on the video call, don't hang up.",
    "Control: asks for OTP, Aadhaar, card or account details, or screen sharing.",
    "Transfer: asks you to move money to a 'safe' or verification account."
  ];
  STAGES.forEach((s) => {
    const c = document.createElement("span");
    c.className = "chip"; c.id = "chip" + s.id; c.textContent = s.id + " " + s.name;
    c.title = STEP_HELP[s.id - 1];
    $("chips").appendChild(c);
    const l = document.createElement("span");
    l.className = "s" + s.id; l.textContent = s.name;
    $("legend").appendChild(l);
  });
  CALLS.forEach((c) => {
    const o = document.createElement("option");
    o.value = c.id; o.textContent = (c.kind === "scam" ? "Scam: " : "Genuine: ") + c.title + " (" + c.lang + ")";
    $("callPick").appendChild(o);
  });
  $("lang").value = store.get("lang", "hi-IN");
  $("lang").onchange = () => {
    store.set("lang", $("lang").value);
    if (rec) { stopMic(); startMic(); }
    // On-device mode: tell the speech server; no need to restart the mic.
    if (ws && ws.readyState === 1) ws.send("lang:" + $("lang").value.slice(0, 2));
  };

  // ---------- tabs ----------
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll(".tab").forEach((x) => { x.classList.toggle("on", x === t); x.setAttribute("aria-selected", x === t); });
      ["live", "demo", "type"].forEach((n) => { $("pane-" + n).hidden = n !== t.dataset.tab; });
    };
  });

  // ---------- transcript and score ----------
  function renderLine(text, matches, genuine, risk) {
    const empty = $("transcript").querySelector(".empty");
    if (empty) empty.remove();
    const ms = matches.slice().sort((a, b) => a.start - b.start);
    let out = "", pos = 0;
    for (const m of ms) {
      if (m.start < pos) continue;
      out += esc(text.slice(pos, m.start)) + '<mark class="s' + m.stage + '" title="' + STAGES[m.stage - 1].name + '">' + esc(text.slice(m.start, m.end)) + "</mark>";
      pos = m.end;
    }
    out += esc(text.slice(pos));
    const d = document.createElement("div");
    d.className = "line" + (genuine ? " genuine" : "") + (risk >= THRESHOLD ? " hot" : "");
    d.innerHTML = "<span>" + out + '</span><span class="r">risk ' + risk + "</span>";
    d.dataset.t = Date.now();
    d.dataset.p = JSON.stringify(ms.map((m) => text.slice(m.start, m.end)));
    const t = $("transcript"), nearBottom = t.scrollHeight - t.scrollTop - t.clientHeight < 60;
    t.appendChild(d);
    // Follow new lines, but don't yank the view away if the user scrolled up to read.
    if (nearBottom) t.scrollTo({ top: t.scrollHeight, behavior: "smooth" });
  }

  function drawSpark() {
    const h = session.history, W = 300, H = 70, pad = 6;
    const y = (v) => H - pad - (v / 100) * (H - 2 * pad);
    const n = Math.max(h.length, 2);
    const x = (i) => pad + (i / (n - 1)) * (W - 2 * pad);
    let svg = '<line x1="0" x2="' + W + '" y1="' + y(THRESHOLD) + '" y2="' + y(THRESHOLD) + '" stroke="#8B2E16" stroke-dasharray="4 4" stroke-width="1" vector-effect="non-scaling-stroke"/>';
    if (h.length) {
      const pts = h.map((v, i) => x(i) + "," + y(v)).join(" ");
      svg += '<polygon points="' + x(0) + "," + (H - pad) + " " + pts + " " + x(h.length - 1) + "," + (H - pad) + '" fill="rgba(224,112,27,.15)"/>';
      svg += '<polyline points="' + pts + '" fill="none" stroke="#4A3B32" stroke-width="2.5" vector-effect="non-scaling-stroke"/>';
    }
    $("spark").innerHTML = svg;
  }

  // Risk number counts up or down to its new value instead of jumping.
  // Favicon turns red on danger, so the warning shows even from another tab.
  function setFavicon(level) {
    const iris = level === "danger" ? "%23C62828" : level === "warn" ? "%23C9962B" : "%23E0701B";
    document.querySelector('link[rel="icon"]').href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cellipse cx='32' cy='32' rx='30' ry='18' fill='%234A3B32'/%3E%3Ccircle cx='32' cy='32' r='12' fill='" + iris + "'/%3E%3Ccircle cx='32' cy='32' r='5' fill='%231E1612'/%3E%3C/svg%3E";
  }
  function countTo(el, to) {
    const from = Number(el.textContent) || 0;
    if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = to; }, dur + 50);   // animation frames pause in hidden tabs
  }
  function update() {
    const r = session.score();
    countTo($("risk"), r.risk);
    setFavicon(r.level);
    document.title = (r.level === "danger" ? "⚠ " : "") + (session.history.length ? r.risk + " · " : "") + "Nazar Scam Shield";
    $("level").textContent = LEVEL_TXT[r.level];
    $("level").dataset.level = r.level;
    $("level").style.color = $("risk").style.color = LEVEL_COL[r.level];
    $("fill").style.width = r.risk + "%";
    $("ring").style.setProperty("--p", r.risk);
    $("ring").style.setProperty("--c", LEVEL_COL[r.level]);
    $("fill").style.background = LEVEL_COL[r.level];
    STAGES.forEach((s) => {
      const on = r.stages.includes(s.id);
      $("chip" + s.id).className = "chip" + (on ? " on" : "") + (on && s.id === 5 ? " last" : "");
    });
    const seen = {};
    session.reasons.forEach((x) => { (seen[x.stage] = seen[x.stage] || new Set()).add(x.phrase); });
    $("why").innerHTML = Object.keys(seen).map((k) => "<li><span class=\"dot s" + k + "\"></span><b>" + STAGES[k - 1].name + ":</b> " + esc([...seen[k]].join(", ")) + "</li>").join("") || "<li>No scam signals yet.</li>";
    drawSpark();
    if (r.level === "danger" && !alerted) raiseAlarm(r);
  }

  function addLine(text) {
    text = String(text || "").trim(); if (!text) return;
    const res = session.add(text);
    session.lines[session.lines.length - 1].t = Date.now();
    renderLine(text, res.matches, res.genuine, session.score().risk);
    update();
  }

  // ---------- warning ----------
  let speakingWarning = false;
  function say(text, lang, onend) {
    try {
      if (!("speechSynthesis" in window)) { onend && onend(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = 0.95;
      const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.replace("_", "-").toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
      if (v) u.voice = v;
      u.onend = u.onerror = () => onend && onend();
      speechSynthesis.speak(u);
    } catch (e) { onend && onend(); }
  }
  function speakWarning() {
    try { speechSynthesis.cancel(); } catch (e) {}
    speakingWarning = true;
    const en = () => say("Warning. This looks like a scam. Do not share your OTP. Do not send money. Hang up now.", "en-IN", () => { speakingWarning = false; });
    if (hindiUI()) say("सावधान! यह कॉल धोखाधड़ी लगती है। अपना ओटीपी किसी को न बताएं। पैसे न भेजें। फ़ोन काट दें।", "hi-IN", en);
    else en();
  }

  // ---------- privacy: short memory ----------
  // Call text is kept for 30 s only. After that a line keeps just its scam phrases (or nothing),
  // in the page and in the detector's session. Stopping the mic forgets everything at once.
  const MEMORY_MS = 30000;
  function forgetLines(olderThan) {
    const now = Date.now();
    $("transcript").querySelectorAll(".line:not(.forgotten)").forEach((d, i) => {
      if (now - Number(d.dataset.t) < olderThan) return;
      const p = JSON.parse(d.dataset.p || "[]");
      d.classList.add("forgotten");
      d.firstChild.textContent = p.length ? "scam signs kept: " + p.join(" · ") : "(forgotten: no scam signs)";
      d.dataset.p = "";
    });
    session.lines.forEach((l) => { if (now - (l.t || 0) >= olderThan) l.text = null; });
  }
  setInterval(() => forgetLines(MEMORY_MS), 5000);

  function familyText(r) {
    const name = store.get("famName", "");
    const steps = r.stages.map((id) => STAGES[id - 1].name.toLowerCase()).join(", ");
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return "Nazar alert: possible scam call right now" + (name ? " (for " + name + ")" : "") +
      "\nRisk: HIGH (" + r.risk + "/100)\nSteps seen: " + steps + "\nTime: " + t +
      "\nPlease call them now and tell them to hang up. Do not share any OTP.";
  }

  function raiseAlarm(r) {
    alerted = true;
    const msg = familyText(r);
    $("family").textContent = msg;
    $("family").className = "family sent";
    $("familyActions").hidden = false;
    const wa = store.get("waNum", "").replace(/\D/g, "");
    $("waLink").href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(msg);
    sendTelegram(msg);
    if (!dismissed) {
      $("ovRisk").textContent = "RISK " + r.risk + " / 100";
      $("overlay").classList.add("show");
      $("hangBtn").focus();
      speakWarning();
      if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 600]);
    }
  }

  async function sendTelegram(msg, statusEl) {
    const out = statusEl || $("tgStatus");
    const token = store.get("tgToken", "").trim(), chat = store.get("tgChat", "").trim();
    if (!token || !chat) { out.textContent = "Telegram is not set up yet, so the alert is shown here only. Open \"Family alert setup\" below to send it for real."; return false; }
    out.textContent = "Sending Telegram alert...";
    try {
      // Form body keeps this a "simple" request: Telegram does not answer CORS preflights.
      const res = await fetch("https://api.telegram.org/bot" + encodeURIComponent(token) + "/sendMessage", {
        method: "POST", body: new URLSearchParams({ chat_id: chat, text: msg })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { out.textContent = "Telegram alert sent at " + new Date().toLocaleTimeString() + "."; return true; }
      out.textContent = "Telegram did not accept the alert: " + (data.description || res.status) + ". Check the token and chat id.";
    } catch (e) {
      out.textContent = "Could not reach Telegram (no internet?). The WhatsApp button still works.";
    }
    return false;
  }

  // ---------- reset ----------
  function resetAll() {
    stopPlay(); session.reset(); alerted = false; dismissed = false;
    $("transcript").innerHTML = '<p class="empty">The call text appears here. Scored words are highlighted by step.</p>';
    $("family").textContent = "Sent automatically when the risk reaches 70. It holds the risk level and the steps seen, never the call text.";
    $("family").className = "family idle";
    $("familyActions").hidden = true; $("tgStatus").textContent = "";
    $("overlay").classList.remove("show");
    $("interim").textContent = "";
    try { speechSynthesis.cancel(); } catch (e) {}
    update();
  }

  // ---------- live microphone ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, wantMic = false;
  let run = 0;   // bumps on every start/stop; async start steps from an older run give up
  // Call timer next to the status while listening.
  let t0 = 0, timer = null;
  function tick() { const s = Math.floor((Date.now() - t0) / 1000); $("micState").dataset.time = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function setMicUI(on, text) {
    clearInterval(timer); delete $("micState").dataset.time;
    if (on) { t0 = Date.now(); tick(); timer = setInterval(tick, 1000); }
    $("micBtn").textContent = on ? "Stop listening" : "Start listening";
    $("micBtn").classList.toggle("live", on);
    $("micBtn").setAttribute("aria-pressed", on ? "true" : "false");
    $("micState").textContent = text || (on ? "Listening" : "Microphone off");
    $("micState").classList.toggle("on", on);
  }
  function startMic() {
    if (!SR) { $("micState").textContent = "Live speech needs Chrome or Edge. Use Sample calls or Type a line instead."; return; }
    stopPlay();
    wantMic = true;
    const r = (rec = new SR());
    rec.lang = $("lang").value; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) { if (!speakingWarning) addLine(txt); }
        else interim += txt;
      }
      $("interim").textContent = interim;
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { wantMic = false; setMicUI(false, "Microphone permission was blocked. Allow it in the address bar and try again."); }
      else if (e.error === "network") { wantMic = false; setMicUI(false, "Speech service needs an internet connection."); }
      else if (e.error === "language-not-supported") { wantMic = false; setMicUI(false, "This browser cannot listen in that language. Try Hindi or English."); }
    };
    // Chrome stops after a pause in speech; keep going until the user presses Stop.
    rec.onend = () => { if (r !== rec) return; if (wantMic) { try { r.start(); } catch (e) { stopListening(); } } else setMicUI(false); };
    try { rec.start(); setMicUI(true); } catch (e) { setMicUI(false, "Could not start the microphone."); }
  }
  // One stop for both engines: whatever is running or still starting is shut down.
  function stopListening(msg) {
    run++;
    if (!msg && session.history.length) {
      const top = Math.max(...session.history), st = session.score().stages.map((id) => STAGES[id - 1].name).join(", ");
      msg = `Call ended · highest risk ${top}` + (st ? ` · steps seen: ${st}` : " · no scam signs");
    }
    forgetLines(0);
    wantMic = false;
    if (rec) { const r = rec; rec = null; try { r.abort(); } catch (e) {} }
    if (ws) { const w = ws; ws = null; try { w.close(); } catch (e) {} }
    if (actx) { actx.close(); actx = null; }
    if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
    $("micBtn").style.setProperty("--lvl", 0);
    setMicUI(false, msg); $("interim").textContent = "";
  }
  const stopMic = stopListening;
  // ---------- on-device speech: mic audio to the local Whisper server (server/server.py) ----------
  let ws = null, actx = null, micStream = null;
  const useWhisper = () => $("engine").value === "whisper";
  async function startWhisper() {
    stopPlay();
    wantMic = true;
    const me = ++run;
    setMicUI(true, "Connecting to the on-device speech server...");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
    } catch (e) { if (me === run) stopListening("Microphone permission was blocked. Allow it in the address bar and try again."); return; }
    if (me !== run) { stream.getTracks().forEach((t) => t.stop()); return; }   // Stop was pressed while waiting
    micStream = stream;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const host = location.port === "8000" ? location.host : "localhost:8000";
    ws = new WebSocket(`${proto}://${host}/ws?lang=${encodeURIComponent($("lang").value)}`);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      if (me !== run) return;
      actx = new AudioContext({ sampleRate: 16000 });
      const srcNode = actx.createMediaStreamSource(micStream);
      const proc = actx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => {
        if (!ws || ws.readyState !== 1) return;
        const f = e.inputBuffer.getChannelData(0), pcm = new Int16Array(f.length);
        let sum = 0;
        for (let i = 0; i < f.length; i++) { pcm[i] = Math.max(-1, Math.min(1, f[i])) * 32767; sum += f[i] * f[i]; }
        // Loudness for the level bar on the mic button, so the user can see the call is heard.
        $("micBtn").style.setProperty("--lvl", Math.min(1, Math.sqrt(sum / f.length) * 8).toFixed(2));
        ws.send(pcm.buffer);
      };
      srcNode.connect(proc); proc.connect(actx.destination);
      setMicUI(true, "Listening (on-device Whisper, no internet needed)");
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.type === "busy") $("interim").textContent = "…";
      if (m.type === "final") {
        $("interim").textContent = m.text ? `Whisper: ${m.sec}s of speech in ${m.ms} ms` : "";
        if (m.text && !speakingWarning) addLine(m.text);
      }
    };
    ws.onerror = () => { if (me === run) stopListening("No on-device speech server. Double-click start.bat, then try again."); };
    ws.onclose = () => { if (me === run) stopListening("Speech server disconnected."); };
  }
  // Space bar starts or stops listening, unless the user is typing.
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat || /INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName)) return;
    if (document.querySelector("#pane-live").hidden) return;
    e.preventDefault(); $("micBtn").click();
  });
  $("micBtn").onclick = () => (wantMic ? stopListening() : (useWhisper() ? startWhisper() : startMic()));
  $("engine").onchange = () => {
    if (wantMic) stopListening();
    if (!useWhisper() && !confirm("Browser speech sends the call audio to the browser's cloud speech service (Google for Chrome). On-device mode keeps audio on this device. Use cloud speech anyway?")) $("engine").value = "whisper";
    showPrivacy();
  };
  function showPrivacy() {
    const local = useWhisper();
    $("privSum").textContent = local ? "🔒 On-device · nothing recorded" : "⚠️ Cloud speech · audio leaves this device";
    $("privacy").innerHTML = (local ? "🔒 <b>On-device</b>: audio never leaves this device." : "⚠️ <b>Cloud speech</b>: audio goes to the browser's speech service.") +
      "<br>Call text is forgotten after 30 s; only scam phrases are kept. Everything is wiped when you stop listening." +
      "<br>Family alert holds only the risk level and steps seen, never what was said.";
  }
  // Offline helper (network first), so the page still opens with no connection.
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  // Served by the local speech server? Then default to on-device speech.
  $("engine").value = "whisper"; showPrivacy();
  fetch("/health").then((r) => r.ok && r.json()).then((h) => { if (h && h.ok) { $("engine").value = "whisper"; $("micHelp").textContent = `On-device speech: ${h.model} on ${h.device.toUpperCase()}. Audio never leaves this laptop. Put the call on speaker next to it.`; } }).catch(() => {});
  $("resetLive").onclick = resetAll;
  if (!SR) $("micHelp").textContent = "This browser has no speech recognition. Open the page in Chrome or Edge for live listening, or use Sample calls and Type a line.";

  // ---------- sample calls ----------
  function stopPlay() { playing = false; if (playTimer) { clearTimeout(playTimer); playTimer = null; } try { if (!speakingWarning) speechSynthesis.cancel(); } catch (e) {} }
  function play(id) {
    stopMic(); resetAll();
    const call = CALLS.find((c) => c.id === id); if (!call) return;
    playing = true;
    let i = 0;
    const text = call.lines.join("");
    const lang = /[਀-੿]/.test(text) ? "pa-IN" : /[ऀ-ॿ]/.test(text) || /Hinglish|Punjabi/.test(call.lang) ? "hi-IN" : "en-IN";
    (function next() {
      if (!playing || i >= call.lines.length) { playing = false; return; }
      addLine(call.lines[i++]);
      if ($("readAloud").checked && !alerted) say(call.lines[i - 1], lang, () => { if (playing) playTimer = setTimeout(next, 400); });
      else playTimer = setTimeout(next, 2000);
    })();
  }
  $("playBtn").onclick = () => play($("callPick").value);
  $("stopBtn").onclick = stopPlay;

  // ---------- typed lines ----------
  $("addBtn").onclick = () => { stopPlay(); addLine($("custom").value); $("custom").value = ""; $("custom").focus(); };
  $("custom").addEventListener("keydown", (e) => { if (e.key === "Enter") $("addBtn").click(); });

  // ---------- overlay ----------
  function closeOverlay() { dismissed = true; $("overlay").classList.remove("show"); try { speechSynthesis.cancel(); } catch (e) {} speakingWarning = false; }
  $("hangBtn").onclick = () => { closeOverlay(); stopMic(); stopPlay(); };
  $("safeBtn").onclick = closeOverlay;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("overlay").classList.contains("show")) closeOverlay(); });

  // ---------- setup ----------
  ["famName", "tgToken", "tgChat", "waNum"].forEach((k) => { $(k).value = store.get(k, ""); });
  $("saveSetup").onclick = () => {
    ["famName", "tgToken", "tgChat", "waNum"].forEach((k) => store.set(k, $(k).value.trim()));
    $("setupMsg").textContent = "Saved in this browser.";
  };
  $("testTg").onclick = () => {
    $("saveSetup").click();
    sendTelegram("Nazar test message: family alerts are working. You will get a message like this if a scam call is detected.", $("setupMsg"));
  };
  $("tgResend").onclick = () => sendTelegram($("family").textContent);
  $("copyAlert").onclick = async () => {
    try { await navigator.clipboard.writeText($("family").textContent); $("copyAlert").textContent = "Copied ✓"; }
    catch (e) { $("copyAlert").textContent = "Copy failed"; }
    setTimeout(() => { $("copyAlert").textContent = "Copy message"; }, 1500);
  };

  // ---------- test bench ----------
  $("benchBtn").textContent = `Run all ${CALLS.length} test calls`;
  $("benchBtn").onclick = () => {
    const tb = $("benchTable").querySelector("tbody");
    tb.innerHTML = "";
    let scams = 0, caught = 0, early = 0, genuine = 0, falseAlarm = 0, caution = 0, other = 0, otherCaught = 0;
    for (const c of CALLS) {
      const s = new Session(); let alertAt = -1;
      c.lines.forEach((l, i) => { s.add(l); if (alertAt < 0 && s.score().risk >= THRESHOLD) alertAt = i; });
      const lvl = s.score().level;
      let res, cls;
      if (c.kind === "scam" && c.scope === "other") {
        // Not a digital-arrest style scam: shown, but kept out of the headline numbers.
        other++; if (alertAt >= 0) otherCaught++;
        res = alertAt >= 0 ? "Caught (other scam type)" : "Missed: other scam type, outside Nazar's pattern"; cls = "mid";
      } else if (c.kind === "scam") {
        scams++;
        if (alertAt >= 0) caught++;
        if (alertAt >= 0 && alertAt < c.moneyAt) { early++; res = "Caught at line " + (alertAt + 1) + ", money asked at line " + (c.moneyAt + 1); cls = "ok"; }
        else if (alertAt >= 0) { res = "Caught at the money ask"; cls = "mid"; }
        else { res = "Missed"; cls = "bad"; }
      } else {
        genuine++;
        if (lvl === "danger") { falseAlarm++; res = "False alarm"; cls = "bad"; }
        else if (lvl === "warn") { caution++; res = "No alarm, caution shown"; cls = "mid"; }
        else { res = "Stayed safe"; cls = "ok"; }
      }
      const tr = document.createElement("tr");
      tr.innerHTML = "<td>" + esc(c.id + " " + c.title) + "</td><td>" + (c.kind === "scam" ? "Scam" : "Genuine") + "</td><td>" + esc(c.lang) +
        '</td><td class="hist">' + s.history.join(" → ") + '</td><td class="' + cls + '">' + res + "</td>";
      tb.appendChild(tr);
    }
    $("benchSummary").innerHTML =
      '<div class="stat"><b>' + caught + "/" + scams + "</b><span>scam calls caught</span></div>" +
      '<div class="stat"><b>' + early + "/" + scams + "</b><span>caught before money was asked for</span></div>" +
      '<div class="stat"><b>' + falseAlarm + "/" + genuine + "</b><span>genuine calls with a false alarm</span></div>" +
      '<div class="stat"><b>' + caution + "/" + genuine + "</b><span>genuine calls with a caution only</span></div>" +
      (other ? '<div class="stat"><b>' + otherCaught + "/" + other + "</b><span>other scam types caught (lottery, fake relative...)</span></div>" : "");
    $("benchSummary").hidden = false; $("benchTable").hidden = false;
  };

  try { speechSynthesis && speechSynthesis.getVoices(); } catch (e) {}
  update();

  // Shareable links: ?call=S1 plays a sample call, ?call=S1&instant=1 loads it at once (no warning screen).
  const q = new URLSearchParams(location.search);
  const pre = CALLS.find((c) => c.id === (q.get("call") || "").toUpperCase());
  if (pre) {
    document.querySelector('.tab[data-tab="demo"]').click();
    $("callPick").value = pre.id;
    if (q.get("instant")) { dismissed = true; pre.lines.forEach(addLine); }
    else play(pre.id);
  }
  if (q.get("bench")) $("benchBtn").click();
})();

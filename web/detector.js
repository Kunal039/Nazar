// Nazar: rule-based scam-call scorer (prototype).
// Five stages of a "digital arrest" call, each with phrase patterns and a weight.
// Starting values; tuned on the scripted test calls in calls.js.
// Shared by the browser page (index.html) and the Node tests (test.js).
(function (root) {
  const STAGES = [
    { id: 1, name: "Authority", hi: "अधिकार", w: 0.35 },
    { id: 2, name: "Fear", hi: "डर", w: 0.5 },
    { id: 3, name: "Isolation", hi: "अकेला करना", w: 0.7 },
    { id: 4, name: "Control", hi: "जानकारी मांगना", w: 0.8 },
    { id: 5, name: "Transfer", hi: "पैसे भेजना", w: 0.9 }
  ];

  // [regex source, phrase weight 0..1]. English, Roman Hinglish and Roman Punjabi,
  // Devanagari (Hindi) and Gurmukhi (Punjabi).
  // JavaScript's \b does not work on Devanagari or Gurmukhi, so those patterns go without it.
  // Spelling variants that speech engines mix up (nukta, adhak, tippi/bindi) are folded
  // by fold() below, for both the patterns and the call text, so write each word once.
  const LEX = {
    1: [
      ["\\b(cbi|cyber ?crime|cyber cell|inspector|customs|narcotics|enforcement directorate|trai|ncb)\\b", 0.8],
      ["\\b(police|officer|court|judge|magistrate)\\b", 0.6],
      ["\\bbank\\b", 0.25],
      ["(सीबीआई|इंस्पेक्टर|साइबर क्राइम|कस्टम|नारकोटिक्स|प्रवर्तन निदेशालय|ट्राई)", 0.8],
      ["(पुलिस|अधिकारी|ऑफिसर|कोर्ट|अदालत)", 0.6],
      ["(जज)", 0.6, "word"],
      ["(बैंक)", 0.25],
      ["(ਸੀਬੀਆਈ|ਇੰਸਪੈਕਟਰ|ਸਾਈਬਰ ਕ੍ਰਾਈਮ|ਸਾਈਬਰ ਸੈੱਲ|ਕਸਟਮ|ਨਾਰਕੋਟਿਕਸ|ਟ੍ਰਾਈ)", 0.8],
      ["(ਪੁਲਿਸ|ਪੁਲੀਸ|ਅਫ਼ਸਰ|ਅਧਿਕਾਰੀ|ਕੋਰਟ|ਅਦਾਲਤ)", 0.6],
      ["(ਜੱਜ)", 0.6, "word"],
      ["(ਬੈਂਕ)", 0.25]
    ],
    2: [
      ["(ग्रग|ड्रक|ड्राग|वोरेंट|वॉरेंट|वारेंट|गरिबतार|गिरबतार|पारसर|पार्सर)", 0.6],
      ["\\b(arrest warrant|digital arrest)\\b", 0.95],
      ["\\b(giraftar|griftar|gira?ftaar|griftaar|arrest|arrested|warrant)\\b", 0.8],
      ["\\b(money laundering|hawala|drugs|fir|jail|gair ?kanooni|illegal)\\b", 0.7],
      ["\\b(sim|account|khata|number)( card)?( \\w+){0,3} (blocked|block|band|freeze|frozen|suspend(ed)?)\\b", 0.6],
      ["\\b(parcel|courier|case)\\b", 0.4],
      ["(अरेस्ट (वारंट|वोरेंट|वॉरेंट|वारेंट)|डिजिटल अरेस्ट)", 0.95],
      ["(गिरफ़्तार|वारंट|अरेस्ट)", 0.8],
      ["(मनी लॉन्ड्रिंग|ड्रग|एफआईआर|जेल|गैरकानूनी|गैर कानूनी|अवैध|हवाला)", 0.7],
      ["((सिम|खाता|अकाउंट|नंबर) (बंद|ब्लॉक))", 0.6],
      ["(पार्सल|कूरियर|मामला)", 0.4],
      ["(केस)", 0.4, "word"],
      ["(ਅਰੈਸਟ ਵਾਰੰਟ|ਡਿਜੀਟਲ ਅਰੈਸਟ)", 0.95],
      ["(ਗ੍ਰਿਫ਼ਤਾਰ|ਗਿਰਫ਼ਤਾਰ|ਵਾਰੰਟ|ਅਰੈਸਟ)", 0.8],
      ["(ਮਨੀ ਲਾਂਡਰਿੰਗ|ਨਸ਼ਾ|ਨਸ਼ੇ|ਡਰੱਗ|ਐਫਆਈਆਰ|ਐੱਫਆਈਆਰ|ਜੇਲ|ਗ਼ੈਰਕਾਨੂੰਨੀ|ਗ਼ੈਰ ਕਾਨੂੰਨੀ|ਗ਼ੈਰ-ਕਾਨੂੰਨੀ|ਹਵਾਲਾ)", 0.7],
      ["((ਸਿਮ|ਖਾਤਾ|ਅਕਾਊਂਟ|ਨੰਬਰ) (ਬੰਦ|ਬਲੌਕ))", 0.6],
      ["(ਪਾਰਸਲ|ਕੋਰੀਅਰ|ਮਾਮਲਾ)", 0.4],
      ["(ਕੇਸ)", 0.4, "word"]
    ],
    3: [
      ["((ghar|ghar walon|gharwalon|family|parivaar|parivar|maa baap) ko (bhi )?(mat|na|nahi) bata|kisi se (bhi )?baat (mat|nahi|na) kar)", 0.9],
      ["(kisi ko (bhi )?(mat |na |nahi )?bata(na|yein|iye|o|ein)|don'?t tell (anyone|anybody|your family)|tell no one|do not tell (anyone|anybody|your family)|do not inform)", 0.95],
      ["(kise nu (vi )?(na|nahi|mat) dass?(na|eyo|io|o|ana|ange))", 0.95],
      ["(video call (par|pe) (bane )?rah(iye|o|en|ein)|stay on (the )?(video )?call|camera on|(call|phone) (mat|na|nahi) (kaat|kat|katt|disconnect)|don'?t (disconnect|cut|end) the call|do not (disconnect|cut|end) the call)", 0.9],
      ["(video call (te|utte|'te) (hi )?(bane )?reh(o|na|eyo))", 0.9],
      ["\\b(confidential|secret)\\b", 0.6],
      ["(किसी को (भी )?(मत|ना|न|नहीं) बता(ना|एं|एँ|इए|इये|ओ|ें))", 0.95],
      ["(वीडियो कॉल पर (बने )?रह|कैमरा (ऑन|चालू)|(कॉल|फ़ोन) (मत|ना|न) (काट|कट))", 0.9],
      ["(गोपनीय|कॉन्फिडेंशियल|सीक्रेट)", 0.6],
      ["(ਕਿਸੇ ?ਨੂੰ? (ਵੀ )?(ਨਾ|ਨਹੀਂ|ਮਤ) ਦੱਸ)", 0.95],
      ["((ਵੀਡੀਓ|ਵੀਡੀਯੋ) ਕਾਲ ?(ਤੇ|ਉੱਤੇ) (ਹੀ )?(ਬਣੇ )?ਰਹ|ਕੈਮਰਾ (ਚਾਲੂ|ਆਨ|ਔਨ)|(ਕਾਲ|ਫ਼ੋਨ) (ਨਾ|ਨਹੀਂ|ਮਤ) ਕੱਟ)", 0.9],
      ["(ਕਾਨਫ਼ੀਡੈਂਸ਼ੀਅਲ|ਸੀਕ੍ਰੇਟ)", 0.6],
      ["(ਗੁਪਤ)", 0.6, "word"]
    ],
    4: [
      ["\b((fd|fixed deposit|savings|investments?|mutual funds?|bank balance)( ki| ke| ka)? (details|detail|jaankari|jankari|statement))\b", 0.7],
      ["\\b(otp|aadhaar number|aadhar number|card number|cvv|pin number|upi pin|atm pin|password|verification code)\\b", 0.85],
      ["\\b(anydesk|teamviewer|screen ?share|remote access|quick ?support)\\b", 0.85],
      ["\\b(bank details|account details|account number)\\b", 0.55],
      ["(ओटीपी|आधार नंबर|पिन नंबर|यूपीआई पिन|पासवर्ड|कार्ड नंबर|सीवीवी|एनीडेस्क|स्क्रीन शेयर)", 0.85],
      ["(बैंक डिटेल|अकाउंट डिटेल|खाता संख्या|अकाउंट नंबर)", 0.55],
      ["(ਓਟੀਪੀ|ਆਧਾਰ ਨੰਬਰ|ਪਿੰਨ|ਪਿਨ ਨੰਬਰ|ਪਾਸਵਰਡ|ਕਾਰਡ ਨੰਬਰ|ਸੀਵੀਵੀ|ਐਨੀਡੈਸਕ|ਐਨੀ ਡੈਸਕ|ਸਕ੍ਰੀਨ ਸ਼ੇਅਰ)", 0.85],
      ["(ਖਾਤੇ ਦੀ ਜਾਣਕਾਰੀ|ਬੈਂਕ ਡਿਟੇਲ|ਅਕਾਊਂਟ ਨੰਬਰ|ਖਾਤਾ ਨੰਬਰ)", 0.55]
    ],
    5: [
      ["(ट्रांसपर|ट्रांसफ़र कीजिए|सेफ अकाउंट|सेफ़ अकाउंट|प्रांच पर|आर्पी आई)", 0.6],
      ["\b(penalty|bail|settlement|clearance|fine)( amount| ke liye| ki rakam)?\b.{0,40}\b(bhej|transfer|jama|pay|deposit|daal)", 0.85],
      ["(safe account|secure account|rbi (ke )?(safe )?account|escrow account|verification amount|refundable (amount|deposit)|security deposit)", 0.95],
      ["\\b(rtgs|neft|imps)\\b", 0.3],
      ["\\btransfer\\b", 0.25],
      ["(सेफ अकाउंट|सुरक्षित खाते|सुरक्षित खाता|आरबीआई (के )?(सेफ )?(अकाउंट|खाते)|वेरिफिकेशन अमाउंट|सिक्योरिटी डिपॉजिट)", 0.95],
      ["(आरटीजीएस|एनईएफटी)", 0.3],
      ["(ट्रांसफर)", 0.25],
      ["(ਸੇਫ਼ ਅਕਾਊਂਟ|ਸੁਰੱਖਿਅਤ ਖਾਤ|ਆਰਬੀਆਈ (ਦੇ )?(ਸੇਫ਼ )?(ਅਕਾਊਂਟ|ਖਾਤ)|ਵੈਰੀਫਿਕੇਸ਼ਨ ਅਮਾਊਂਟ|ਸਿਕਿਓਰਿਟੀ ਡਿਪਾਜ਼ਿਟ|ਸਕਿਓਰਿਟੀ ਡਿਪਾਜ਼ਿਟ)", 0.95],
      ["(ਆਰਟੀਜੀਐਸ|ਐਨਈਐਫਟੀ)", 0.3],
      ["(ਟ੍ਰਾਂਸਫਰ|ਟਰਾਂਸਫਰ)", 0.25]
    ]
  };

  // Genuine "never share your OTP" style warnings: do not count the OTP mention in that line.
  const GENUINE_SRC = "((do not|don't|never) (share|ask|disclose|tell)|share na (karein|kare|kijiye|karna|karo|kareyo)|saanjha na kar|kabhi (nahi|nahin) (poochh|maang)|kade (vi )?(nahi|nai) (puchh|mang)|never ask" +
    "|(otp|code) (sirf |only )?(delivery|darwaze|door)|delivery (ke )?(time|samay|par|pe) (otp|code)|share (the )?otp only with (the )?delivery" +
    "|(शेयर|साझा) (न|ना|मत) कर|कभी (नहीं|नही) (पूछ|मांग|माँग)" +
    "|(ਸਾਂਝਾ|ਸ਼ੇਅਰ) (ਨਾ|ਨਹੀਂ|ਮਤ) ਕਰ|ਕਦੇ (ਵੀ )?(ਨਹੀਂ|ਨਾ) (ਪੁੱਛ|ਮੰਗ))";

  // Fold spelling variants so one pattern matches them all:
  // - Gurmukhi is mapped onto Devanagari letter for letter (the two blocks are parallel), because Whisper
  //   often writes Punjabi speech in Hindi script ("ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸਿਓ" comes out as "किसेनू ना दस्यो").
  //   So every Punjabi pattern also matches Punjabi written in Devanagari, and Hindi patterns match Gurmukhi.
  // - nukta (ਫ਼/ਫ, ज़/ज), halant (Punjabi rarely writes it: ਅਰੈਸਟ vs अरेस्ट) and adhak (ੱ) are dropped;
  //   tippi and chandrabindu become anusvara;
  // - long and short i/u, ai/e, au/o, ॉ/ा and ण/न are treated as the same (ਪੁਲਿਸ/ਪੁਲੀਸ, ਅਰੈਸਟ/अरेस्ट, कॉल/काल, ਬਣੇ/बने).
  // Returns the folded text and, for each folded character, its index in the original,
  // so matches can still be highlighted in the text the user sees.
  const VOWEL_FOLD = { "ऊ": "उ", "ू": "ु", "ई": "इ", "ी": "ि",
    "ऐ": "ए", "ै": "े", "औ": "ओ", "ौ": "ो", "ँ": "ं",
    "ण": "न", "ॉ": "ा", "ऑ": "आ" };
  function gurmukhiToDevanagari(c) {
    if (c === "ੱ") return "";            // adhak (doubling mark)
    if (c === "ੰ") return "ं";      // tippi -> anusvara
    if (c === "ੲ") return "इ";      // iri vowel carrier
    if (c === "ੳ") return "उ";      // ura vowel carrier
    return String.fromCharCode(c.charCodeAt(0) - 0x100);
  }
  function fold(text) {
    const s = String(text);
    let t = "";
    const map = [];
    for (let i = 0; i < s.length; i++) {
      const d = s[i].normalize("NFD")
        .replace(/[਀-੿]/g, gurmukhiToDevanagari)
        .normalize("NFD")                       // e.g. ੜ -> ड़ -> ड + nukta
        .replace(/[़्]/g, "")         // nukta, halant
        .replace(/[ऊूईीऐैऔौँणॉऑ]/g, (c) => VOWEL_FOLD[c])
        .replace(/[‘’]/g, "'").toLowerCase();
      for (const ch of d) { t += ch; map.push(i); }
    }
    map.push(s.length);
    return { t, map };
  }
  // Every pattern must start at the beginning of a word, in any script (\b only knows ASCII),
  // so "ਕੇਸ" (case) is not found inside "ਵੈਰੀਫਿਕੇਸ਼ਨ" (verification). Patterns may still end mid-word,
  // on purpose: stems like "ਦੱਸ" or "ड्रग" should match "ਦੱਸਿਓ" and "ड्रग्स". Short words that could be the start of
  // something harmless are marked "word" and must also end where the word ends ("गुप्ता" is a surname, not ਗੁਪਤ, secret).
  const WORD_START = "(?<![\\p{L}\\p{M}\\p{N}])";
  const WORD_END = "(?![\\p{L}\\p{M}\\p{N}])";
  const COMPILED = STAGES.map((st) => LEX[st.id].map(([src, wt, word]) => ({ stage: st.id, re: new RegExp(WORD_START + "(?:" + fold(src).t + ")" + (word ? WORD_END : ""), "giu"), wt })));
  const GENUINE = new RegExp(fold(GENUINE_SRC).t, "iu");
  const WORDCHAR = /[\p{L}\p{M}\p{N}]/u;
  // Second-person words. A scammer always talks *to* the listener ("your Aadhaar", "aapke naam par");
  // a news report or a story about a scam (G22) only talks *about* other people.
  const YOU_SRC = "(you|your|yours|yourself|aap|aapka|aapke|aapki|aapko|apka|apke|apko|tum|tumhara|tumhe|tera|teri|tujhe|tusi|tussi|tuhade|tuhada|tuhadi|tuhanu|tainu)";
  // Hindi/Punjabi forms as stems, so आपका, आपके, तुम्हारा, ਤੁਹਾਡਾ all count.
  const YOU_INDIC_SRC = "(आप|तुम|तेरा|तेरी|तुझ|ਤੁਸੀਂ|ਤੁਸੀ|ਤੁਹਾ|ਤੈਨੂੰ|ਤੇਰਾ|ਤੇਰੀ|ਆਪ)";
  const YOU = new RegExp(WORD_START + "(?:" + fold(YOU_SRC).t + WORD_END + "|" + fold(YOU_INDIC_SRC).t + ")", "iu");
  const NOT_ADDRESSED_CAP = 39;
  // Scam awareness: a caller who warns about scams, mentions the 1930 helpline or tells you to report it
  // is not running one (bank warnings, cyber-cell follow-ups, reporters, family retelling a scam call).
  const AWARE_SRC = "(1930|scams?|thagi|thugi|ठगी|ठग|धोखा|ਠੱਗੀ|ਧੋਖਾ|dhokha|report (it|kariye|karein|karo|kar do)|शिकायत|ਸ਼ਿਕਾਇਤ)";
  const AWARE = new RegExp(WORD_START + "(?:" + fold(AWARE_SRC).t + ")", "iu");
  // "This is not a scam" is a classic scammer line, not awareness: it must not switch off the alarm.
  const DENIAL_SRC = "((not|no) (a |an )?(fraud |scam |fake )?(scam|fraud|fake)|(koi |ye |yeh )?(scam|fraud|thagi|dhokha|fake)( call)? (nahi|nahin|nai)|(ठगी|धोखा|फ्रॉड|स्कैम)( कॉल)? (नहीं|नही)|(ਠੱਗੀ|ਧੋਖਾ)( ਕਾਲ)? (ਨਹੀਂ|ਨਹੀ))";
  const DENIAL = new RegExp(WORD_START + "(?:" + fold(DENIAL_SRC).t + ")", "iu");
  const AWARE_CAP = 69;

  function analyzeLine(text) {
    const src = String(text);
    const { t, map } = fold(src);
    const genuine = GENUINE.test(t);
    const matches = [];
    for (const group of COMPILED) {
      for (const { stage, re, wt } of group) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(t)) !== null) {
          if (m[0].length === 0) { re.lastIndex++; continue; }
          if (stage === 4 && genuine) continue;
          const start = map[m.index];
          let end = map[m.index + m[0].length - 1] + 1;
          while (end < src.length && WORDCHAR.test(src[end])) end++; // highlight whole words, never half a letter
          matches.push({ stage, start, end, text: src.slice(start, end), weight: wt });
        }
      }
    }
    return { matches, genuine, addressed: YOU.test(t), aware: AWARE.test(t) && !DENIAL.test(t) };
  }

  class Session {
    constructor() { this.reset(); }
    reset() { this.addressed = false; this.aware = false; this.lines = []; this.conf = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; this.first = {}; this.reasons = []; this.history = []; }
    add(text) {
      const idx = this.lines.length;
      const res = analyzeLine(text);
      this.lines.push({ text, matches: res.matches, genuine: res.genuine });
      if (res.addressed) this.addressed = true;
      if (res.aware) this.aware = true;
      for (const m of res.matches) {
        if (m.weight > this.conf[m.stage]) this.conf[m.stage] = m.weight;
        if (this.first[m.stage] === undefined) this.first[m.stage] = idx;
        this.reasons.push({ stage: m.stage, phrase: m.text });
      }
      this.history.push(this.score().risk);
      return res;
    }
    score() {
      let keep = 1;
      for (const st of STAGES) keep *= 1 - this.conf[st.id] * st.w;
      const base = 100 * (1 - keep);
      // Bonus when the steps show up in the scam's usual order.
      let prog = 0;
      for (let s = 1; s <= 4; s++) {
        if (this.conf[s] > 0 && this.conf[s + 1] > 0 && this.first[s] <= this.first[s + 1]) prog += 8;
      }
      prog = Math.min(prog, 24);
      let risk = Math.max(0, Math.min(100, Math.round(base + prog)));
      // Threats count only when aimed at the listener: never alarm on a call that has not said "you" yet.
      if (!this.addressed) risk = Math.min(risk, NOT_ADDRESSED_CAP);
      // A call that shows scam awareness gets a caution at most, never the full alarm.
      if (this.aware) risk = Math.min(risk, AWARE_CAP);
      const level = risk >= THRESHOLD ? "danger" : risk >= 40 ? "warn" : "safe";
      const stages = STAGES.filter((s) => this.conf[s.id] > 0).map((s) => s.id);
      return { risk, level, stages };
    }
  }

  const THRESHOLD = 70;

  const api = { STAGES, LEX, THRESHOLD, Session, analyzeLine };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== "undefined" ? window : globalThis);

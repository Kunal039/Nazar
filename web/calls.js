// Scripted test calls for Nazar. All fictional, written by the team.
// kind: "scam" must reach danger (risk >= 70) before the money is asked for;
//       "genuine" must never reach danger.
// moneyAt: index of the line where a scam first asks for money (scams only).
// Several genuine calls are deliberately tricky (real police, real bank fraud team, delivery OTP).
(function (root) {
  const CALLS = [
    // ---------- Scam calls ----------
    { id: "S1", kind: "scam", lang: "Hinglish", title: "Digital arrest: drugs parcel", moneyAt: 5, lines: [
      "Hello, main Inspector Sharma bol raha hoon, Cyber Crime Branch se.",
      "Aapke Aadhaar se juda ek parcel pakda gaya hai, usme drugs mile hain.",
      "Aapke naam par arrest warrant nikal chuka hai, aap giraftar ho sakte hain.",
      "Yeh case bahut confidential hai, kisi ko mat batana, video call par bane rahiye.",
      "Verification ke liye apna Aadhaar number aur OTP batayiye.",
      "Jaanch ke liye paise RBI ke safe account mein transfer kijiye."
    ]},
    { id: "S2", kind: "scam", lang: "Hindi", title: "Digital arrest in Hindi script", moneyAt: 4, lines: [
      "नमस्ते, मैं सीबीआई से अधिकारी वर्मा बोल रहा हूँ।",
      "आपके नाम पर मनी लॉन्ड्रिंग का केस दर्ज हुआ है, अरेस्ट वारंट जारी है।",
      "यह बात किसी को मत बताना, वीडियो कॉल पर बने रहिए।",
      "अपना आधार नंबर और ओटीपी बताइए।",
      "जांच पूरी होने तक पैसे आरबीआई के सेफ अकाउंट में ट्रांसफर कीजिए।"
    ]},
    { id: "S3", kind: "scam", lang: "English", title: "Customs officer, courier", moneyAt: 4, lines: [
      "Good afternoon, this is an officer from Mumbai Customs.",
      "A courier in your name was stopped with illegal items and an FIR has been filed.",
      "This is confidential. Do not tell anyone and do not disconnect the call.",
      "Please share your card number and the OTP you just received.",
      "You must pay a refundable security deposit to clear your name."
    ]},
    { id: "S4", kind: "scam", lang: "Hinglish", title: "TRAI SIM block", moneyAt: 4, lines: [
      "Main TRAI se bol rahi hoon.",
      "Aapka SIM band ho jayega do ghante mein, aapke number se illegal messages gaye hain.",
      "Mumbai police ne case darj kiya hai, call mat katna, main aapko officer se jod rahi hoon.",
      "Officer: apna Aadhaar number aur OTP batayiye verification ke liye.",
      "Clearance ke liye verification amount NEFT kar dijiye."
    ]},
    { id: "S5", kind: "scam", lang: "English", title: "Fake bank KYC with AnyDesk", moneyAt: 3, lines: [
      "Hello sir, I am calling from your bank's KYC department.",
      "Your account will be blocked today because KYC is pending.",
      "Please install AnyDesk so I can update it for you, and tell me the OTP.",
      "Now transfer the balance to this secure account for safety."
    ]},
    { id: "S6", kind: "scam", lang: "Hinglish", title: "ED money laundering, son's account", moneyAt: 4, lines: [
      "Hum Enforcement Directorate se bol rahe hain.",
      "Aapke account se hawala ka paisa gaya hai, aap giraftar ho sakte hain.",
      "Ghar mein kisi ko bhi mat batana, camera on rakhiye.",
      "Apne account details aur UPI PIN confirm kijiye.",
      "Court ke order tak saare paise escrow account mein RTGS kar dijiye."
    ]},
    { id: "S7", kind: "scam", lang: "English", title: "Narcotics bureau video call", moneyAt: 4, lines: [
      "This is the narcotics department. You are under digital arrest.",
      "Drugs were found in a package booked with your ID.",
      "Stay on the video call and keep the camera on.",
      "Read out the verification code we sent you.",
      "Transfer the verification amount now or the police will arrive."
    ]},
    { id: "S8", kind: "scam", lang: "Hinglish", title: "Fake judge, bail money", moneyAt: 3, lines: [
      "Main magistrate ke office se bol raha hoon, aapke khilaf warrant hai.",
      "Yeh secret hai, kisi ko na batayein.",
      "Apna PIN number aur OTP abhi bataiye.",
      "Bail ke liye safe account mein paise bhejiye."
    ]},
    { id: "S9", kind: "scam", lang: "Hindi", title: "Police, SIM and screen share", moneyAt: 4, lines: [
      "मैं साइबर क्राइम पुलिस से इंस्पेक्टर बोल रहा हूँ।",
      "आपके नंबर से गैरकानूनी काम हुआ है, एफआईआर दर्ज है।",
      "कॉल मत काटिए और किसी को मत बताइए।",
      "स्क्रीन शेयर चालू कीजिए और ओटीपी बताइए।",
      "अब सिक्योरिटी डिपॉजिट ट्रांसफर कर दीजिए।"
    ]},
    { id: "S10", kind: "scam", lang: "Hinglish", title: "Courier, short and fast", moneyAt: 3, lines: [
      "Sir FedEx courier se bol raha hoon, aapka parcel customs ne roka hai.",
      "Usme drugs mile hain, CBI aapko arrest karegi.",
      "Abhi OTP bataiye aur kisi ko mat batana.",
      "Case band karne ke liye safe account mein paisa transfer karo."
    ]},

    // ---------- Genuine calls ----------
    { id: "G1", kind: "genuine", lang: "Hinglish", title: "Bank card bill reminder", lines: [
      "Namaste, main aapke bank se bol rahi hoon.",
      "Aapke credit card ka bill due hai, payment app se kar sakte hain.",
      "Kripya apna OTP kisi ke saath share na karein, hum kabhi nahi poochhte.",
      "Dhanyavaad, aapka din shubh ho."
    ]},
    { id: "G2", kind: "genuine", lang: "English", title: "Bank fraud team (real)", lines: [
      "Hello, this is the fraud monitoring team at your bank.",
      "We blocked a suspicious card transaction of two thousand rupees. Was it you?",
      "Thank you. We never ask for your OTP or PIN, so do not share it with anyone.",
      "A new card will reach you in five days."
    ]},
    { id: "G3", kind: "genuine", lang: "Hinglish", title: "Local police, lost phone report", lines: [
      "Namaste, main Sector 17 police station se constable Rana bol raha hoon.",
      "Aapne kal phone kho jaane ki complaint di thi.",
      "Aapka phone mil gaya hai, kal subah thane aakar le jaiye.",
      "Apna ID proof saath laana."
    ]},
    { id: "G4", kind: "genuine", lang: "English", title: "Delivery agent asking for delivery OTP", lines: [
      "Hi, I'm outside your building with your Amazon order.",
      "Can you come down to the gate?",
      "Please tell me the delivery OTP on your app so I can close the order."
    ]},
    { id: "G5", kind: "genuine", lang: "Hinglish", title: "Family discussing a scam in the news", lines: [
      "Papa, aapne news dekhi? Ek uncle ko digital arrest scam mein phasa diya.",
      "Unhe kisi ne CBI officer ban kar call kiya tha.",
      "Agar aapko aisa call aaye toh turant phone kaat dena aur mujhe bata dena."
    ]},
    { id: "G6", kind: "genuine", lang: "Hinglish", title: "Friend splitting a dinner bill", lines: [
      "Bhai kal ka dinner mast tha.",
      "Mere hisse ke paise maine UPI se transfer kar diye hain.",
      "Agle hafte phir milte hain."
    ]},
    { id: "G7", kind: "genuine", lang: "Hindi", title: "Doctor's clinic appointment", lines: [
      "नमस्ते, मैं डॉक्टर गुप्ता की क्लिनिक से बोल रही हूँ।",
      "आपकी कल सुबह दस बजे की अपॉइंटमेंट पक्की है।",
      "अपनी पुरानी रिपोर्ट साथ लेकर आइए।"
    ]},
    { id: "G8", kind: "genuine", lang: "English", title: "Electricity bill reminder", lines: [
      "This is a reminder from your electricity board.",
      "Your bill of eight hundred rupees is due on the twentieth.",
      "You can pay it in the official app or at the office counter."
    ]},
    { id: "G9", kind: "genuine", lang: "Hindi", title: "Bank branch, cheque book", lines: [
      "नमस्ते, मैं आपके बैंक की ब्रांच से बोल रहा हूँ।",
      "आपकी चेक बुक आ गई है, आप ब्रांच से ले सकते हैं।",
      "अपना ओटीपी या पिन किसी को शेयर न करें, बैंक कभी नहीं पूछता।"
    ]},
    { id: "G10", kind: "genuine", lang: "Hinglish", title: "Lawyer about a property case", lines: [
      "Namaste ji, main Advocate Mehra bol raha hoon.",
      "Aapke plot wale case ki agli date court mein agle mahine hai.",
      "Documents ki copy le aana, baaki main dekh lunga."
    ]},

    // =====================================================================
    // Set v2 (22 Oct 2026): written BEFORE the Punjabi word lists were added,
    // so the first run on these calls shows how the detector does on unseen calls.
    // scope: "other" marks scams outside the digital-arrest pattern Nazar targets;
    // they are reported separately and do not fail the tests.
    // =====================================================================

    // ---------- Scam calls, set v2 ----------
    { id: "S11", set: "v2", kind: "scam", lang: "Punjabi", title: "Digital arrest in Gurmukhi: drugs parcel", moneyAt: 5, lines: [
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਸੀਬੀਆਈ ਤੋਂ ਇੰਸਪੈਕਟਰ ਸਿੱਧੂ ਬੋਲ ਰਿਹਾ ਹਾਂ।",
      "ਤੁਹਾਡੇ ਆਧਾਰ ਨਾਲ ਜੁੜਿਆ ਇੱਕ ਪਾਰਸਲ ਫੜਿਆ ਗਿਆ ਹੈ, ਉਸ ਵਿੱਚ ਨਸ਼ਾ ਮਿਲਿਆ ਹੈ।",
      "ਤੁਹਾਡੇ ਨਾਮ ਤੇ ਅਰੈਸਟ ਵਾਰੰਟ ਨਿਕਲ ਚੁੱਕਾ ਹੈ, ਤੁਸੀਂ ਗ੍ਰਿਫ਼ਤਾਰ ਹੋ ਸਕਦੇ ਹੋ।",
      "ਇਹ ਗੱਲ ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸਿਓ, ਵੀਡੀਓ ਕਾਲ ਤੇ ਬਣੇ ਰਹੋ।",
      "ਵੈਰੀਫਿਕੇਸ਼ਨ ਲਈ ਆਪਣਾ ਆਧਾਰ ਨੰਬਰ ਅਤੇ ਓਟੀਪੀ ਦੱਸੋ।",
      "ਜਾਂਚ ਲਈ ਪੈਸੇ ਆਰਬੀਆਈ ਦੇ ਸੇਫ਼ ਅਕਾਊਂਟ ਵਿੱਚ ਟ੍ਰਾਂਸਫਰ ਕਰੋ।"
    ]},
    { id: "S12", set: "v2", kind: "scam", lang: "Punjabi", title: "Police, money laundering, video call", moneyAt: 4, lines: [
      "ਮੈਂ ਸਾਈਬਰ ਕ੍ਰਾਈਮ ਪੁਲਿਸ ਤੋਂ ਅਫ਼ਸਰ ਬੋਲ ਰਿਹਾ ਹਾਂ।",
      "ਤੁਹਾਡੇ ਖਾਤੇ ਤੋਂ ਮਨੀ ਲਾਂਡਰਿੰਗ ਹੋਈ ਹੈ, ਤੁਹਾਡੇ ਖ਼ਿਲਾਫ਼ ਐਫਆਈਆਰ ਦਰਜ ਹੈ।",
      "ਕੈਮਰਾ ਚਾਲੂ ਰੱਖੋ ਅਤੇ ਘਰ ਵਿੱਚ ਕਿਸੇ ਨੂੰ ਵੀ ਨਾ ਦੱਸਣਾ।",
      "ਆਪਣੇ ਖਾਤੇ ਦੀ ਜਾਣਕਾਰੀ ਅਤੇ ਪਿੰਨ ਨੰਬਰ ਦੱਸੋ।",
      "ਜਾਂਚ ਪੂਰੀ ਹੋਣ ਤੱਕ ਸਾਰੇ ਪੈਸੇ ਸੁਰੱਖਿਅਤ ਖਾਤੇ ਵਿੱਚ ਭੇਜ ਦਿਓ।"
    ]},
    { id: "S13", set: "v2", kind: "scam", lang: "Punjabi", title: "Fake bank KYC in Gurmukhi", moneyAt: 3, lines: [
      "ਮੈਂ ਤੁਹਾਡੇ ਬੈਂਕ ਤੋਂ ਬੋਲ ਰਹੀ ਹਾਂ, ਤੁਹਾਡਾ ਕੇਵਾਈਸੀ ਪੂਰਾ ਨਹੀਂ ਹੈ।",
      "ਅੱਜ ਤੁਹਾਡਾ ਖਾਤਾ ਬੰਦ ਹੋ ਜਾਵੇਗਾ।",
      "ਹੁਣੇ ਆਏ ਓਟੀਪੀ ਦੱਸੋ ਅਤੇ ਐਨੀਡੈਸਕ ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ।",
      "ਪੈਸੇ ਸੁਰੱਖਿਅਤ ਰੱਖਣ ਲਈ ਸੇਫ ਅਕਾਊਂਟ ਵਿੱਚ ਟਰਾਂਸਫਰ ਕਰੋ।"
    ]},
    { id: "S14", set: "v2", kind: "scam", lang: "Punjabi (Roman)", title: "Customs parcel in Roman Punjabi", moneyAt: 4, lines: [
      "Main customs department ton officer bol reha haan.",
      "Tuhada parcel airport te fadeya gaya, ohde vich drugs ne.",
      "Tuhade naam te warrant hai, tusi giraftaar ho sakde ho.",
      "Kise nu vi na dasseyo, video call te hi reho, OTP dasso.",
      "Case band karan layi safe account vich paise transfer karo."
    ]},
    { id: "S15", set: "v2", kind: "scam", lang: "Punjabi (Roman)", title: "TRAI SIM block in Roman Punjabi", moneyAt: 4, lines: [
      "Main TRAI ton bol rahi haan.",
      "Tuhada SIM do ghante vich band ho jauga, tuhade number ton illegal messages gaye ne.",
      "Police ne case darj kita hai, call na katteyo.",
      "Verification layi apna Aadhaar number te OTP dasso.",
      "Clearance layi verification amount NEFT kar deyo."
    ]},
    { id: "S16", set: "v2", kind: "scam", lang: "Punjabi", title: "Short and fast, Gurmukhi", moneyAt: 3, lines: [
      "ਮੈਂ ਕੋਰੀਅਰ ਕੰਪਨੀ ਤੋਂ ਬੋਲ ਰਿਹਾ ਹਾਂ, ਤੁਹਾਡਾ ਪਾਰਸਲ ਕਸਟਮ ਨੇ ਰੋਕਿਆ ਹੈ।",
      "ਉਸ ਵਿੱਚ ਡਰੱਗਜ਼ ਹਨ, ਪੁਲਿਸ ਤੁਹਾਨੂੰ ਗ੍ਰਿਫਤਾਰ ਕਰੇਗੀ।",
      "ਹੁਣੇ ਓਟੀਪੀ ਦੱਸੋ ਅਤੇ ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸਣਾ।",
      "ਕੇਸ ਬੰਦ ਕਰਨ ਲਈ ਸੇਫ ਅਕਾਊਂਟ ਵਿੱਚ ਪੈਸੇ ਟ੍ਰਾਂਸਫਰ ਕਰੋ।"
    ]},
    { id: "S17", set: "v2", kind: "scam", scope: "other", lang: "Hinglish", title: "Electricity cut-off with AnyDesk", moneyAt: 3, lines: [
      "Namaste, main bijli vibhag se bol raha hoon.",
      "Aapka pichla bill update nahi hua, aaj raat nau baje bijli kaat di jayegi.",
      "Abhi AnyDesk download kijiye, main bill update kar deta hoon.",
      "Ab das rupaye ka payment kijiye aur screen par aaya code bataiye."
    ]},
    { id: "S18", set: "v2", kind: "scam", lang: "Hinglish", title: "Son in police custody", moneyAt: 3, lines: [
      "Main thane se inspector bol raha hoon, aapka beta humari custody mein hai.",
      "Uske paas se drugs mile hain, FIR ho jayegi aur jail jayega.",
      "Kisi ko mat batana, warna case aur kharab hoga.",
      "Case band karwane ke liye abhi is account mein paise transfer karo."
    ]},
    { id: "S19", set: "v2", kind: "scam", lang: "English", title: "Fake bank fraud team, secure account", moneyAt: 3, lines: [
      "Hello, I am calling from the fraud department of your bank.",
      "Someone is trying to take money from your account right now and it will be frozen.",
      "Read me the OTP you just got so I can stop the transaction.",
      "To keep your savings safe, move them to this secure account immediately."
    ]},
    { id: "S20", set: "v2", kind: "scam", lang: "Hindi", title: "FedEx, Mumbai police, Skype", moneyAt: 4, lines: [
      "मैं फेडएक्स कूरियर से बोल रहा हूँ, आपका पार्सल मुंबई कस्टम ने रोका है।",
      "मैं आपको मुंबई पुलिस से जोड़ रहा हूँ।",
      "पुलिस: आपके नाम पर ड्रग केस है, आपको डिजिटल अरेस्ट किया जा रहा है।",
      "स्काइप पर वीडियो कॉल पर बने रहिए और किसी को मत बताइए।",
      "जांच के लिए अपने खाते के पैसे आरबीआई के खाते में ट्रांसफर कीजिए।"
    ]},
    { id: "S21", set: "v2", kind: "scam", lang: "Hinglish", title: "CBI, break your FDs", moneyAt: 4, lines: [
      "Main CBI headquarters se DSP Rathore bol raha hoon.",
      "Aapke account mein hawala ka paisa aaya hai, aapke khilaf arrest warrant hai.",
      "WhatsApp video call par bane rahiye, phone mat kaatna.",
      "Apne saare bank accounts ki details aur net banking password bhejiye.",
      "Saari FD tod kar paisa RBI ke verification account mein RTGS kijiye."
    ]},
    { id: "S22", set: "v2", kind: "scam", lang: "English", title: "Polite 'court registry', slow build", moneyAt: 5, lines: [
      "Good morning, I'm calling from the Supreme Court registry.",
      "There is a pending matter in your name that we need to verify today.",
      "It concerns a bank account opened with your ID that was used for illegal transfers.",
      "Please keep this confidential while we verify, and stay on the call.",
      "Share your account number so the officer can match the records.",
      "A refundable security deposit is needed until the hearing."
    ]},
    { id: "S23", set: "v2", kind: "scam", scope: "other", lang: "Hinglish", title: "KBC lottery prize fee", moneyAt: 2, lines: [
      "Badhai ho! Aapka number KBC lucky draw mein chuna gaya hai.",
      "Aapne pachees lakh rupaye jeete hain.",
      "Prize lene ke liye pehle processing fee ke pandrah hazaar bhejne honge."
    ]},
    { id: "S24", set: "v2", kind: "scam", scope: "other", lang: "Hinglish", title: "'Relative' in hospital, urgent money", moneyAt: 1, lines: [
      "Mama ji main Rohit, mera accident ho gaya hai, hospital mein hoon.",
      "Abhi isi number par bees hazaar Google Pay kar do, ghar par mat batana.",
      "Main kal wapas kar dunga, jaldi karo."
    ]},
    { id: "S25", set: "v2", kind: "scam", lang: "Punjabi (Roman)", title: "Ludhiana cyber cell, code-mixed", moneyAt: 4, lines: [
      "Main Ludhiana cyber cell ton inspector Gill bol reha haan.",
      "Tuhade Aadhaar te ik FIR hai, money laundering da case hai.",
      "Eh confidential hai, kise nu na dasseyo.",
      "Apna card number te CVV dasso verification layi.",
      "Security deposit vajon paise safe account vich bhej deyo."
    ]},

    // ---------- Genuine calls, set v2 ----------
    { id: "G11", set: "v2", kind: "genuine", lang: "Punjabi", title: "Bank reminder in Gurmukhi", lines: [
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਜੀ, ਮੈਂ ਤੁਹਾਡੇ ਬੈਂਕ ਤੋਂ ਬੋਲ ਰਹੀ ਹਾਂ।",
      "ਤੁਹਾਡੇ ਕਰਜ਼ੇ ਦੀ ਕਿਸ਼ਤ ਪੰਜ ਤਾਰੀਖ ਨੂੰ ਹੈ।",
      "ਆਪਣਾ ਓਟੀਪੀ ਕਿਸੇ ਨਾਲ ਸਾਂਝਾ ਨਾ ਕਰੋ, ਬੈਂਕ ਕਦੇ ਨਹੀਂ ਪੁੱਛਦਾ।"
    ]},
    { id: "G12", set: "v2", kind: "genuine", lang: "Punjabi", title: "Mother calling about dinner", lines: [
      "ਪੁੱਤ, ਅੱਜ ਰਾਤ ਨੂੰ ਖਾਣੇ ਤੇ ਘਰ ਆ ਜਾਈਂ।",
      "ਤੇਰੇ ਮਾਮਾ ਜੀ ਵੀ ਆ ਰਹੇ ਨੇ।",
      "ਆਉਂਦੇ ਹੋਏ ਦਹੀਂ ਲੈ ਆਈਂ।"
    ]},
    { id: "G13", set: "v2", kind: "genuine", lang: "Punjabi", title: "Real police, passport verification", lines: [
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਥਾਣਾ ਸਦਰ ਤੋਂ ਹੌਲਦਾਰ ਬੋਲ ਰਿਹਾ ਹਾਂ।",
      "ਤੁਹਾਡੀ ਪਾਸਪੋਰਟ ਵੈਰੀਫਿਕੇਸ਼ਨ ਲਈ ਕੱਲ੍ਹ ਸਵੇਰੇ ਦਸ ਵਜੇ ਥਾਣੇ ਆਉਣਾ ਹੈ।",
      "ਆਪਣਾ ਅਸਲ ਆਧਾਰ ਕਾਰਡ ਅਤੇ ਦੋ ਫੋਟੋਆਂ ਨਾਲ ਲੈ ਆਉਣਾ।"
    ]},
    { id: "G14", set: "v2", kind: "genuine", lang: "Punjabi (Roman)", title: "Friend paying share of a trip", lines: [
      "Oye Manpreet, Manali wale trip de paise main tuhanu transfer kar ditte ne.",
      "Hotel di booking kal tak kar deyo.",
      "Baaki gallan shaam nu karange."
    ]},
    { id: "G15", set: "v2", kind: "genuine", lang: "Punjabi", title: "Family discussing a scam in the news", lines: [
      "ਬਾਪੂ ਜੀ, ਖ਼ਬਰਾਂ ਵਿੱਚ ਆਇਆ ਕਿ ਸਾਡੇ ਪਿੰਡ ਦੇ ਇੱਕ ਬੰਦੇ ਨਾਲ ਡਿਜੀਟਲ ਅਰੈਸਟ ਦਾ ਧੋਖਾ ਹੋਇਆ।",
      "ਕਿਸੇ ਨੇ ਪੁਲਿਸ ਵਾਲਾ ਬਣ ਕੇ ਫ਼ੋਨ ਕੀਤਾ ਸੀ।",
      "ਜੇ ਤੁਹਾਨੂੰ ਇਹੋ ਜਿਹਾ ਫ਼ੋਨ ਆਵੇ ਤਾਂ ਕੱਟ ਦਿਓ ਅਤੇ ਮੈਨੂੰ ਦੱਸੋ।"
    ]},
    { id: "G16", set: "v2", kind: "genuine", lang: "Hinglish", title: "Daughter asking for a login OTP", lines: [
      "Papa, main Netflix login kar rahi hoon aapke account se.",
      "Aapke phone par ek OTP aaya hoga, please bata do."
    ]},
    { id: "G17", set: "v2", kind: "genuine", lang: "English", title: "Real cyber cell, complaint update", lines: [
      "Hello, this is the cyber crime cell. You filed a complaint about a fraud last month.",
      "An FIR has been registered and our team is tracing the account.",
      "You do not need to pay anything. We will call you when there is an update."
    ]},
    { id: "G18", set: "v2", kind: "genuine", lang: "Hinglish", title: "School fee reminder", lines: [
      "Namaste, main DAV school ke office se bol rahi hoon.",
      "Aarav ki second term ki fees pandrah tareekh tak jama karni hai.",
      "Aap school app se ya counter par payment kar sakte hain."
    ]},
    { id: "G19", set: "v2", kind: "genuine", lang: "English", title: "Insurance renewal", lines: [
      "Hi, this is a reminder from your health insurance company.",
      "Your policy expires on the thirtieth of this month.",
      "You can renew it on our website or through your agent."
    ]},
    { id: "G20", set: "v2", kind: "genuine", lang: "Hindi", title: "Gas cylinder delivery code", lines: [
      "नमस्ते, मैं गैस एजेंसी से बोल रहा हूँ।",
      "आपका सिलेंडर आज शाम को आएगा।",
      "डिलीवरी के समय एसएमएस में आया कोड डिलीवरी वाले को बता दीजिए।"
    ]},
    { id: "G21", set: "v2", kind: "genuine", lang: "Hinglish", title: "Bank RM offering a fixed deposit", lines: [
      "Good afternoon sir, main aapki bank branch se relationship manager bol rahi hoon.",
      "Is mahine FD par saat percent interest mil raha hai.",
      "Agar aap chahein toh branch aakar ya net banking se NEFT karke FD bana sakte hain."
    ]},
    { id: "G22", set: "v2", kind: "genuine", lang: "English", title: "TV news report on a scam racket", lines: [
      "In today's news, police arrested three men running a digital arrest racket.",
      "The gang posed as CBI officers and kept victims on video calls.",
      "Officials remind citizens that no agency arrests anyone over a phone call."
    ]},
    { id: "G23", set: "v2", kind: "genuine", lang: "Hinglish", title: "Friend who is a lawyer, court date", lines: [
      "Bhai, kal mera court mein ek case hai, isliye main nahi aa paunga.",
      "Judge ne next date de di toh Sunday ko milte hain."
    ]},
    { id: "G24", set: "v2", kind: "genuine", lang: "Hindi", title: "Lab report ready", lines: [
      "नमस्ते, मैं पैथोलॉजी लैब से बोल रही हूँ।",
      "आपकी ब्लड रिपोर्ट तैयार है, आप ऐप पर देख सकते हैं।"
    ]},
    { id: "G25", set: "v2", kind: "genuine", lang: "Punjabi", title: "Farmer, mandi payment", lines: [
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ ਚਾਚਾ ਜੀ, ਮੰਡੀ ਵਿੱਚ ਕਣਕ ਦਾ ਭਾਅ ਅੱਜ ਠੀਕ ਹੈ।",
      "ਆੜ੍ਹਤੀਏ ਨੇ ਪੈਸੇ ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਟ੍ਰਾਂਸਫਰ ਕਰ ਦਿੱਤੇ ਹਨ।",
      "ਸ਼ਾਮ ਨੂੰ ਟਰਾਲੀ ਵਾਪਸ ਲੈ ਆਵਾਂਗੇ।"
    ]},
    { id: "G26", set: "v2", kind: "genuine", lang: "Punjabi (Roman)", title: "Cousin's wedding plans", lines: [
      "Veere, Simran di wedding agle mahine Jalandhar vich hai.",
      "Tusi sab ne pakka aana hai, card kal bhej dewange."
    ]},
    { id: "G27", set: "v2", kind: "genuine", lang: "English", title: "Customer care, user called them", lines: [
      "Thank you for calling customer care, how can I help you?",
      "Your refund will go back to your original payment method in five days.",
      "Please never share your OTP or card number with anyone, including us."
    ]},
    { id: "G28", set: "v2", kind: "genuine", lang: "Hinglish", title: "Cab driver asking ride OTP", lines: [
      "Sir main aapka cab driver, gate number do par khada hoon.",
      "Ride start karne ke liye OTP bata dijiye."
    ]},
    { id: "G29", set: "v2", kind: "genuine", lang: "English", title: "Office IT support, screen share", lines: [
      "Hi, this is Rakesh from the IT helpdesk, you raised a ticket about Outlook.",
      "Can you share your screen on Teams so I can take a look?"
    ]},
    { id: "G30", set: "v2", kind: "genuine", lang: "Hindi", title: "Grandmother asks grandson for help", lines: [
      "बेटा, मेरे फ़ोन में पैसे भेजने वाला ऐप नहीं चल रहा।",
      "तू मेरी तरफ़ से बिजली का बिल भर दे, मैं तुझे पैसे दे दूँगी।"
    ]}
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = { CALLS };
  else root.CALLS = CALLS;
})(typeof window !== "undefined" ? window : globalThis);

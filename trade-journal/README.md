# 📈 TradeLog — Jouw persoonlijke trade journal

## 🚀 Live zetten in 5 stappen (gratis)

### Stap 1 — Maak een GitHub account
Ga naar [github.com](https://github.com) en maak een gratis account aan.

### Stap 2 — Maak een nieuw repository
1. Klik op de groene **"New"** knop
2. Noem het: `trade-journal`
3. Zet op **Public**
4. Klik **"Create repository"**

### Stap 3 — Upload de bestanden
1. Klik op **"uploading an existing file"**
2. Sleep de **volledige inhoud** van deze zip naar het upload-venster
   (let op: upload de bestanden/mappen zelf, niet de zip)
3. Klik **"Commit changes"**

### Stap 4 — Maak een Vercel account
Ga naar [vercel.com](https://vercel.com) en klik **"Sign up with GitHub"**

### Stap 5 — Deploy
1. Klik op **"Add New Project"**
2. Selecteer jouw `trade-journal` repository
3. Klik **"Deploy"** — Vercel doet de rest automatisch

✅ **Klaar!** Je krijgt een link zoals `trade-journal-xyz.vercel.app`

---

## 🔄 Updates installeren
Wanneer je een update krijgt van je trade journal:
1. Download het nieuwe `App.js` bestand
2. Ga naar jouw GitHub repository → `src/App.js`
3. Klik op het potlood-icoon (edit)
4. Plak de nieuwe code → **"Commit changes"**
5. Vercel deployt automatisch binnen 30 seconden ✓

---

## 📦 Wat zit er in dit project?
```
trade-journal/
├── public/
│   └── index.html        ← De HTML basis
├── src/
│   ├── index.js          ← React opstartpunt
│   └── App.js            ← De volledige app (hier werk je in)
├── package.json          ← Projectconfiguratie
└── README.md             ← Dit bestand
```

## 💾 Opslag
Je trades worden opgeslagen in **localStorage** van je browser.
Dit betekent dat ze bewaard blijven zolang je dezelfde browser gebruikt.

Wil je trades synchroniseren tussen apparaten? Vraag dan om een database-upgrade!

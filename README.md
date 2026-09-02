# Mehendi Artist Website

Mehendi artist ke liye ek single-page website — portfolio, rates, reviews aur booking form.
Plain HTML/CSS/JS hai, koi build ya install nahi chahiye.

---

## Site kaise dekhein

Sabse aasan: `index.html` pe double-click karo, browser me khul jayegi.

Behtar (photos aur form theek se test karne ke liye) — terminal me:

```bash
cd C:\Github\mehendi-website
python -m http.server 8080
```

Phir browser me: **http://localhost:8080**

Rok'ne ke liye `Ctrl+C`.

---

## Kya-kya badalna hai — 3 steps

### Step 1 — Apni details bharo

`js/config.js` kholo (Notepad se bhi khul jayegi) aur sabse upar wala hissa badlo:

```js
const SITE = {
  brand:       "Mehendi by Swity",   // <- business ka naam
  artist:      "Swity Tularam Kolhe",// <- pura naam
  artistShort: "Swity",              // <- About me "Namaste, main ___"
  whatsapp:    "919145671694",       // <- WhatsApp number (91 ke saath, bina + ke)
  phone:       "+91 91456 71694",    // <- dikhane ke liye
  email:       "",                   // <- abhi khaali, daal do to row dikhegi
  city:        "Warud",
  seoArea:     "Warud, Amravati",    // <- page title me
  areas:       "Warud, Morshi, Amravati, Katol, Nagpur aur aas-paas ke ilaake",
  instagram:   "",                   // <- Instagram ka pura link
};
```

> **WhatsApp number ka format zaroori hai:** country code ke saath, bina `+`, bina space.
> Sahi: `919145671694` — Galat: `+91 91456 71694`, `9145671694`

### Step 2 — Photos daalo

`images/README.md` padho — poora tarika waha likha hai. Short me:

1. Design photos `images/gallery/` folder me daalo
2. `js/config.js` ki `GALLERY` list me har photo ki ek line add karo
3. `images/hero.jpg` aur `images/artist.jpg` bhi daal do

### Step 3 — Rates, reviews aur FAQ badlo

Sab kuch `js/config.js` me hi hai:

| Kya badalna hai | Config me kahan |
|-----------------|-----------------|
| Package ke rates | `PACKAGES` |
| Client ke reviews | `TESTIMONIALS` |
| Sawaal-jawaab | `FAQS` |
| Services ki list | `SERVICES` |
| Hero ke neeche numbers | `SITE.stats` |
| Form ke dropdown | `OCCASIONS`, `SERVICE_TYPES` |

File save karke browser me `Ctrl+R` dabao — badlav turant dikhega.

---

## Booking form kaise kaam karta hai

**WhatsApp (chalu hai):** client form bharke button dabata hai → uska WhatsApp khulta hai
pehle se likhe hue message ke saath → wo bas send dabata hai → message bahan ke number pe aa jaata hai.

**Email (optional, abhi band hai):** enable karna ho to —

1. [web3forms.com](https://web3forms.com) pe jao
2. Apni email daalo → free access key mil jayegi (koi account nahi banana)
3. Key ko `js/config.js` me paste karo:
   ```js
   web3formsKey: "yahan-apni-key-paste-karo",
   ```

Key daalte hi "Email pe bhejo" button apne aap dikhne lagega. Key khaali hai to button hidden rehta hai
aur WhatsApp wala rasta poora kaam karta rehta hai.

---

## Admin panel — UI se hi sab kuch add karo

`admin.html` browser me kholo (local server chalu hona chahiye):
**http://localhost:8080/admin.html**

Yahan bina code chhue ye sab kar sakte ho:

| Tab | Kya kar sakte ho |
|-----|------------------|
| **Designs** | Photo upload, category, naam, rate + original price. Add / edit / delete. |
| **Rates** | Package ka naam, price, original price, features. Discount % apne aap nikalta hai. |
| **FAQ** | Sawaal-jawaab add / edit / delete |
| **Numbers** | Hero ke neeche wale stats |
| **Contact** | Naam, WhatsApp, sheher, Instagram, email |

### Photo upload

Photo chuno ya drag karke chhod do — badi photo apne aap chhoti ho jati hai
(max 1400px, ~200KB). File ka naam bhi apne aap ban jata hai, jaise `bridal-03.jpg`.

### Original price aur discount

Do field hain — **Original price** aur **Aaj ka price**. Dono bharte hi
discount % apne aap nikal jata hai aur site pe aise dikhta hai:

> ~~₹4,500~~ **₹3,500**  `22% OFF`

Original price khaali chhod do to sirf normal price dikhega, koi badge nahi.
Package me price ki jagah `Custom` jaisa shabd bhi likh sakte ho.

### Folder jodo — ek baar ka kaam (sabse zaroori)

Admin kholte hi upar **"Folder jodo"** dabaiye aur `mehendi-website` folder chuniye.
Chrome permission maangega — "Edit files" allow kar dijiye.

Uske baad **jo bhi save karenge wo seedha website ki files me likha jayega**:
- nayi photo → `images/gallery/` me
- baaki sab → `js/config.js` me

Matlab save karte hi asli site update ho jayegi. Upar **"Site dekho"** dabakar
refresh kariye, nayi design wahan hogi.

> Ye Chrome aur Edge me chalta hai (File System Access API). Firefox/Safari me
> ye button nahi dikhega — wahan "Download (ZIP)" se files nikaal ke khud folder
> me daalni padengi.

> Folder ek hi baar chunna hota hai. Browser band karke dobara kholenge to Chrome
> ek baar permission phir se poochh sakta hai — bas "Allow" dabaiye.

### Admin ka password

Abhi **koi password nahi hai** — testing ke dauraan jaan-boojh ke hataya gaya hai.

Password wala poora system (PBKDF2 hash, lock screen, "30 din yaad rakho")
commit `634a1fd` me maujood hai. Wapas laana ho to:

```bash
git revert --no-commit 634a1fd   # ya us commit se files nikaal lo
```

Tab tak dhyan rahe: admin ka URL jise bhi mila wo use kar sakta hai. Abhi isse
site ko nuksaan nahi hota (admin ka koi network call hi nahi hai, wo sirf apne
browser aur apne chune hue folder me likhta hai), par GitHub token add karne se
**pehle** password wapas lagana zaroori hoga.

### Live site pe daalna

Folder jodne ke baad files aapke computer par update hoti hain. Internet par
dikhane ke liye phir bhi push karna padta hai:

```bash
cd C:\Github\mehendi-website
git add .
git commit -m "nayi designs"
git push
```

### Admin ka data kahan hai

Data aur photos browser me bhi rehte hain (localStorage + IndexedDB), taaki
folder jode bina bhi kaam kar sako. Par **wo data us browser ka hai** — doosre
browser ya doosre computer pe admin khaali dikhega. Isliye admin hamesha
**`http://localhost:8080/admin.html`** se hi kholiye, kisi tunnel/preview link se nahi.

> Admin page pe abhi koi password nahi hai (`noindex` laga hai to Google me nahi
> aayega). Jo bhi us URL pe pahunchega wo edit kar sakta hai — GitHub Pages pe
> daalne se pehle ya to admin ko deploy se bahar rakhna hoga, ya password lagana hoga.


---

## Internet pe live kaise karein (free)

GitHub Pages se, bilkul free:

```bash
cd C:\Github\mehendi-website
git init
git add .
git commit -m "Mehendi website"
git branch -M main
git remote add origin https://github.com/<username>/mehendi-website.git
git push -u origin main
```

Phir GitHub pe: **Settings → Pages → Source: `main` / `root` → Save**

1-2 minute me site live: `https://<username>.github.io/mehendi-website/`

> Live hone ke baad `index.html` me `<link rel="canonical">` aur `og:image` ka URL
> apni asli site ka URL kar dena — WhatsApp pe link bhejne pe preview card sahi dikhega.

Aage badlav karne ho to: file edit karo → `git add . && git commit -m "update" && git push` →
site apne aap update ho jayegi.

---

## Files kya-kya hain

```
index.html          poora page ka structure
css/style.css       colours, layout, design
css/responsive.css  mobile/tablet ke liye adjustments
js/config.js        ★ site ka saara data (admin isi ko banata hai)
js/render.js        config ka data page pe daalta hai
js/main.js          menu, gallery filter, lightbox, accordion
js/booking.js       form validation + WhatsApp/email

admin.html          ★ ADMIN PANEL - UI se add/edit karne ke liye
css/admin.css       admin ke styles
js/admin-store.js   data localStorage me, photos IndexedDB me
js/admin-export.js  config.js banata hai + ZIP banata hai
js/admin-publish.js seedha project folder me file likhta hai
js/admin.js         admin ka UI logic
images/gallery/     ★ design photos yahan
favicon.svg         browser tab ka icon
```

---

## Site me kya-kya hai

- Sticky navbar + mobile hamburger menu
- Hero section WhatsApp booking button ke saath
- Count-up animation wale stats
- 6 service cards
- Gallery — category filter + lightbox (arrow keys, ESC, swipe)
- 4 package rate cards
- About + USP badges
- 4-step process
- Auto-scroll reviews slider
- Booking form — validation ke saath, WhatsApp + email
- FAQ accordion
- Footer + floating WhatsApp button + back-to-top
- WhatsApp pe link share karne pe preview card (OpenGraph)
- Google ke liye LocalBusiness schema
- Gallery aur packages pe original price + discount badge
- Mobile-first responsive, keyboard-accessible
- **Admin panel** — photo upload, rates, FAQ, contact sab UI se
- Admin se save karte hi asli site update (folder jodne ke baad)

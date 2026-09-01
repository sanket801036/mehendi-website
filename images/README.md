# Photos yahan daalni hain

## 1. Gallery ki photos

Sab design photos `gallery/` folder me daalo.

**Naam aise rakho** (chhote akshar, bina space ke):

```
bridal-01.jpg
bridal-02.jpg
arabic-01.jpg
party-01.jpg
feet-01.jpg
kids-01.jpg
```

Photo daalne ke baad `js/config.js` khol ke `GALLERY` list me ek line add karo:

```js
{ file: "bridal-03.jpg", category: "bridal", alt: "Full haath bridal design" },
```

- `file`     = photo ka naam, bilkul waisa hi jaisa folder me hai
- `category` = `bridal` | `arabic` | `party` | `feet` | `kids`
- `alt`      = photo me kya hai, chhota sa description (Google aur blind users ke liye zaroori)

## 2. Do khaas photos

| File | Kahan dikhegi | Size |
|------|---------------|------|
| `hero.jpg`   | Sabse upar, background me | 1600 x 1000 px (landscape) |
| `artist.jpg` | About section me, bahan ki photo | 800 x 950 px (portrait) |

Ye do photos seedhe `images/` folder me rakho, `gallery/` me nahi.

## 3. Photo ka size

Phone se li gayi photo 4-6 MB ki hoti hai — site bahut slow ho jayegi.

**Upload se pehle compress karo:**
- Website: [squoosh.app](https://squoosh.app) ya [tinypng.com](https://tinypng.com) — free hai, kuch install nahi karna
- Har photo **300 KB se kam** honi chahiye
- Gallery photos **portrait** (khadi) me sabse achhi lagti hain — 900 x 1200 px kaafi hai

## 4. Photo nahi daali to kya hoga?

Site tab bhi chalegi — gallery me khaali box dikhega jisme file ka naam likha hoga.
Isse pata chal jayega ki kaunsi photo daalni baaki hai. Kuch toota hua nahi dikhega.

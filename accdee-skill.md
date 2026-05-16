# ACCDEE Skill Reference

## Selected Skills for This Project

1. **Frontend Skill** (primary) — HTML/CSS/JS patterns, responsive UI, image integration
2. **API Security Best Practices** (secondary) — rate limiting, input validation, .env hygiene

---

## Dark Neon Theme (CSS Variables)

```css
:root {
  --neon-blue:    #00d4ff;
  --neon-purple:  #b400ff;
  --neon-green:   #00ff88;
  --neon-pink:    #ff0080;
  --bg-dark:      #060610;
  --bg-card:      #0d0d2b;
  --bg-card2:     #10103a;
  --text-primary: #ffffff;
  --text-muted:   rgba(255,255,255,0.6);
  --border-glow:  rgba(0,212,255,0.3);
}
```

### Glow Card Pattern
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-glow);
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0,212,255,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 30px rgba(0,212,255,0.25);
}
```

### Neon Button Pattern
```css
.btn-primary {
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 28px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}
.btn-primary:hover { opacity: 0.85; transform: translateY(-2px); }
```

---

## Hero Banner Carousel (Vanilla JS)

### HTML Structure
```html
<div class="hero-carousel" id="heroCarousel">
  <div class="hero-slides">
    <div class="hero-slide active">
      <img src="images/hero-main.jpg" alt="ACCDEE">
    </div>
    <!-- more slides -->
  </div>
  <div class="hero-dots" id="heroDots"></div>
  <button class="hero-arrow hero-prev" onclick="heroSlide(-1)">&#10094;</button>
  <button class="hero-arrow hero-next" onclick="heroSlide(1)">&#10095;</button>
</div>
```

### CSS Pattern
```css
.hero-carousel { position: relative; overflow: hidden; border-radius: 12px; }
.hero-slides   { display: flex; transition: transform 0.5s ease; }
.hero-slide    { min-width: 100%; flex-shrink: 0; }
.hero-slide img { width: 100%; height: auto; display: block; }
.hero-dots     { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.hero-dot      { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.4); border: none; cursor: pointer; }
.hero-dot.active { background: var(--neon-green); width: 24px; border-radius: 5px; }
.hero-arrow    { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 18px; }
.hero-prev { left: 12px; }
.hero-next { right: 12px; }
```

### JS Pattern
```js
let heroIdx = 0;
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots   = document.querySelectorAll('.hero-dot');
let heroTimer = setInterval(() => heroSlide(1), 4000);

function heroSlide(dir) {
  heroSlides[heroIdx].classList.remove('active');
  heroDots[heroIdx].classList.remove('active');
  heroIdx = (heroIdx + dir + heroSlides.length) % heroSlides.length;
  heroSlides[heroIdx].classList.add('active');
  heroDots[heroIdx].classList.add('active');
  document.querySelector('.hero-slides').style.transform = `translateX(-${heroIdx * 100}%)`;
  clearInterval(heroTimer);
  heroTimer = setInterval(() => heroSlide(1), 4000);
}
```

---

## Product Card with Image Banner

```html
<div class="product-card">
  <div class="product-banner">
    <img src="images/banner-facebook.jpg" alt="Facebook">
    <span class="product-badge">ยอดนิยม</span>
  </div>
  <div class="product-body">
    <h3 class="product-name">Facebook Premium</h3>
    <p class="product-price">฿50</p>
    <button class="btn-buy">ซื้อเลย</button>
  </div>
</div>
```

```css
.product-card    { background: var(--bg-card); border: 1px solid var(--border-glow); border-radius: 12px; overflow: hidden; }
.product-banner  { position: relative; }
.product-banner img { width: 100%; height: 160px; object-fit: cover; display: block; }
.product-badge   { position: absolute; top: 10px; right: 10px; background: var(--neon-green); color: #000; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.product-body    { padding: 16px; }
.product-name    { color: var(--neon-blue); font-size: 1rem; font-weight: 700; margin-bottom: 6px; }
.product-price   { color: var(--neon-green); font-size: 1.3rem; font-weight: 900; margin-bottom: 12px; }
.btn-buy         { width: 100%; background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple)); color: #fff; border: none; border-radius: 8px; padding: 10px; font-weight: 700; cursor: pointer; }
```

---

## Image Map (public/images/)

| File | Product |
|------|---------|
| `hero-main.jpg`           | Hero carousel slide 1 |
| `hero-alt.png`            | Hero carousel slide 2 |
| `banner-facebook.jpg`     | Facebook Account |
| `banner-fb-ads.jpg`       | Facebook Ads / BM |
| `banner-fanpage.jpg`      | Fanpage |
| `banner-bm-premium.jpg`   | Business Manager Premium |
| `banner-bm-premium2.jpg`  | BM Premium (สำรอง) |
| `banner-bm-personal.jpg`  | BM Personal เก่า |
| `banner-fb-personal.jpg`  | Facebook Personal |
| `banner-twitter.jpg`      | Twitter Premium |
| `banner-twitter-personal.jpg` | Twitter Personal |
| `banner-instagram.jpg`    | Instagram Premium |
| `banner-ig-personal.jpg`  | Instagram Personal |
| `banner-tiktok.jpg`       | TikTok |
| `banner-gmail.jpg`        | Gmail |
| `banner-netflix.jpg`      | Netflix |

---

## Security Checklist

- [ ] .env ไม่อยู่ใน git (ตรวจ .gitignore)
- [ ] Rate limiting: `express-rate-limit` บน `/api/auth/*` (max 10/15min)
- [ ] Parameterized queries ทุก SQL (ห้าม string concatenation)
- [ ] Cloudinary upload: validate mimetype = image/*, maxSize 5MB
- [ ] Admin routes: ผ่าน `adminMiddleware.js` ทุก route
- [ ] JWT secret ยาว 32+ ตัวอักษร

### Rate Limit Setup
```js
const rateLimit = require('express-rate-limit');
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 10,
  message: { error: 'ลองใหม่ใน 15 นาที' } }));
```

---

## Vanilla JS Fetch Helper

```js
const API = {
  token: () => localStorage.getItem('token'),
  headers: () => ({
    'Content-Type': 'application/json',
    ...(API.token() ? { Authorization: `Bearer ${API.token()}` } : {})
  }),
  get: (url) => fetch(url, { headers: API.headers() }).then(r => r.json()),
  post: (url, body) => fetch(url, { method:'POST', headers: API.headers(), body: JSON.stringify(body) }).then(r => r.json()),
};
```

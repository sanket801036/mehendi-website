/* ============================================================
   RENDER - config.js ka data page pe daalta hai
   Is file ko chhedne ki zaroorat nahi. Sirf config.js edit karo.

   Draft mode: URL me ?draft=1 lagao to admin panel ka (abhi tak
   export na kiya hua) data dikhega - sirf tumhare browser me.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function $(sel)    { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // config.js `const SITE = ...` likhta hai. Top-level const script-scope me
  // banta hai, window ka property NAHI banta - isliye seedha naam padhna padta
  // hai, window[name] se nahi. Missing ho to try/catch fallback de deta hai.
  function def(getter, fallback) {
    try {
      var v = getter();
      return v === undefined ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  /* ---------- Config ek jagah, taaki draft se badla ja sake ---------- */

  var CFG = {
    site:         def(function () { return SITE; }, {}),
    stats:        def(function () { return SITE.stats; }, []),
    gallery:      def(function () { return GALLERY; }, []),
    filters:      def(function () { return GALLERY_FILTERS; }, []),
    packages:     def(function () { return PACKAGES; }, []),
    testimonials: def(function () { return TESTIMONIALS; }, []),
    faqs:         def(function () { return FAQS; }, []),
    services:     def(function () { return SERVICES; }, []),
    process:      def(function () { return PROCESS; }, []),
    occasions:    def(function () { return OCCASIONS; }, []),
    serviceTypes: def(function () { return SERVICE_TYPES; }, []),
  };

  var isDraft = /[?&]draft=1(?:&|$)/.test(location.search);

  /* ---------- Paisa ---------- */

  function rupee(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function discountPct(mrp, price) {
    var m = Number(mrp), p = Number(price);
    if (!Number.isFinite(m) || !Number.isFinite(p) || m <= 0 || p < 0 || p >= m) return null;
    return Math.round((1 - p / m) * 100);
  }

  /** Price block - number ho to ₹ + kata hua MRP + OFF badge, warna text jaisa ka waisa */
  function priceHTML(price, mrp, cls) {
    if (price == null || price === "") return "";
    cls = cls || "price";

    if (!Number.isFinite(Number(price))) {
      return '<div class="' + cls + '"><span class="' + cls + '__now">' + esc(price) + "</span></div>";
    }

    var pct = discountPct(mrp, price);
    return '<div class="' + cls + '">' +
             '<span class="' + cls + '__now">' + rupee(price) + "</span>" +
             (pct ? '<span class="' + cls + '__mrp">' + rupee(mrp) + "</span>" +
                    '<span class="' + cls + '__off">' + pct + "% OFF</span>" : "") +
           "</div>";
  }

  /* ---------- WhatsApp ---------- */

  function waLink(msg) {
    var num = String(CFG.site.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(msg || "");
  }
  window.waLink = waLink;

  /* ---------- Service icons ---------- */

  var ICONS = {
    bridal: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 9a3.5 3.5 0 0 1 7 2.5C19 16.6 12 21 12 21z"/><path d="M12 9V3M9 5l3-2 3 2"/></svg>',
    party:  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l5-14 9 9-14 5z"/><path d="M14 4l1 2M18 3l-.5 2M20 8l-2 .5"/></svg>',
    leaf:   '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16z"/><path d="M4 20c3-5 7-8 12-9"/></svg>',
    star:   '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8L12 3z"/></svg>',
    kids:   '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0"/></svg>',
    event:  '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3M8 17h6"/></svg>',
  };

  /* ---------- 1. SITE ke text placeholders ---------- */

  function fillSiteText() {
    var s = CFG.site;
    var first = CFG.stats[0];
    var years = first ? first.value + (first.suffix || "") : "";

    var map = {
      brand: s.brand, artist: s.artist,
      "artist-short": s.artistShort || s.artist,
      tagline: s.tagline, city: s.city, areas: s.areas,
      "stat-years": years,
    };

    $all("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      if (map[key]) el.textContent = map[key];
    });

    if (s.brand) {
      var area = s.seoArea || s.city;
      document.title = s.brand + " | Bridal & Party Mehendi Artist" + (area ? ", " + area : "");
      var og = $('meta[property="og:title"]');
      if (og) og.setAttribute("content", s.brand + " | Mehendi Artist" + (area ? ", " + area : ""));
    }

    var ld = $("#ldJson");
    if (ld) {
      var social = [s.instagram, s.facebook, s.youtube].filter(Boolean);
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HealthAndBeautyBusiness",
        name: s.brand,
        description: s.tagline,
        // "Nagpur aur aas-paas ke ilaake" -> sirf sheher ka naam
        areaServed: (s.areas || s.city || "").split(",").map(function (a) {
          return a.replace(/\s*aur\s+aas[\s-]?paas.*$/i, "").trim();
        }).filter(Boolean),
        address: s.postalCode ? {
          "@type": "PostalAddress",
          addressLocality: s.city, postalCode: s.postalCode,
          addressRegion: "Maharashtra", addressCountry: "IN",
        } : undefined,
        priceRange: "₹₹",
        telephone: s.whatsapp ? "+" + String(s.whatsapp).replace(/\D/g, "") : undefined,
        email: s.email || undefined,
        sameAs: social.length ? social : undefined,
      });
    }

    var yr = $("#year");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------- 2. WhatsApp links ---------- */

  function fillWaLinks() {
    $all("[data-wa-link]").forEach(function (a) {
      a.href = waLink(a.getAttribute("data-wa-msg") || "Hello!");
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  /* ---------- 3. Stats ---------- */

  function renderStats() {
    var box = $("#statsGrid");
    if (!box) return;

    box.innerHTML = CFG.stats.map(function (s) {
      var val = Number(s.value) || 0;
      var suffix = s.suffix || "";
      // Shuru se hi sahi number - animation na chale to bhi "0" na dikhe
      return '<div class="stat reveal">' +
               '<div class="stat__value" data-count="' + val + '" data-suffix="' + esc(suffix) + '">' +
                 esc(val.toLocaleString("en-IN") + suffix) + "</div>" +
               '<div class="stat__label">' + esc(s.label) + "</div>" +
             "</div>";
    }).join("");
  }

  /* ---------- 4. Services ---------- */

  function renderServices() {
    var box = $("#servicesGrid");
    if (!box) return;
    box.innerHTML = CFG.services.map(function (s) {
      return '<article class="service reveal">' +
               '<div class="service__icon" aria-hidden="true">' + (ICONS[s.icon] || ICONS.star) + "</div>" +
               "<h3>" + esc(s.title) + "</h3><p>" + esc(s.desc) + "</p></article>";
    }).join("");
  }

  /* ---------- 5. Gallery ---------- */

  function renderGallery() {
    var filterBox = $("#galleryFilters");
    var gridBox = $("#galleryGrid");
    if (!gridBox) return;

    // draft me filters config se nahi, asli categories se banate hain
    var filters = CFG.filters;
    if (isDraft) {
      var cats = [];
      CFG.gallery.forEach(function (g) {
        if (g.category && cats.indexOf(g.category) === -1) cats.push(g.category);
      });
      filters = [{ id: "all", label: "Sab" }].concat(cats.map(function (c) {
        return { id: c, label: c.charAt(0).toUpperCase() + c.slice(1) };
      }));
    }

    if (filterBox) {
      filterBox.innerHTML = filters.map(function (f, i) {
        return '<button class="filter' + (i === 0 ? " is-active" : "") + '" data-filter="' +
               esc(f.id) + '" role="tab" aria-selected="' + (i === 0) + '">' + esc(f.label) + "</button>";
      }).join("");
    }

    gridBox.innerHTML = CFG.gallery.map(function (g, i) {
      var match = filters.filter(function (f) { return f.id === g.category; })[0];
      var label = (match && match.label) || g.category;
      var pct = discountPct(g.mrp, g.price);

      return '<button class="gallery__item" data-cat="' + esc(g.category) + '" data-index="' + i + '" ' +
               'data-file="' + esc(g.file) + '" aria-label="' + esc(g.alt) + ' - badi photo dekhein">' +
               '<img src="images/gallery/' + esc(g.file) + '" alt="' + esc(g.alt) + '" ' +
                    'loading="lazy" width="300" height="400" ' +
                    'onerror="this.classList.add(\'img--missing\')">' +
               (pct ? '<span class="gallery__off">' + pct + "% OFF</span>" : "") +
               '<span class="gallery__overlay">' +
                 '<span class="gallery__cat">' + esc(label) + "</span>" +
                 (g.title ? '<span class="gallery__name">' + esc(g.title) + "</span>" : "") +
                 priceHTML(g.price, g.mrp, "gprice") +
               "</span></button>";
    }).join("");

    // draft me photos IndexedDB se aati hain
    if (isDraft && window.Store) {
      CFG.gallery.forEach(function (g, i) {
        if (g.builtin) return;
        Store.imageURL(g).then(function (url) {
          var img = gridBox.querySelector('[data-index="' + i + '"] img');
          if (img) { img.src = url; img.classList.remove("img--missing"); }
        });
      });
    }
  }

  /* ---------- 6. Packages ---------- */

  function renderPackages() {
    var box = $("#packagesGrid");
    if (!box) return;

    box.innerHTML = CFG.packages.map(function (p) {
      var msg = "Hello! Mujhe *" + p.name + "* package ke baare me jaankari chahiye. Rate aur availability bata dijiye.";
      var pct = discountPct(p.mrp, p.price);

      return '<article class="package reveal' + (p.featured ? " package--featured" : "") + '">' +
               (p.featured ? '<span class="package__tag">Sabse Popular</span>' : "") +
               (pct ? '<span class="package__off">' + pct + "% OFF</span>" : "") +
               "<h3>" + esc(p.name) + "</h3>" +
               '<p class="package__desc">' + esc(p.desc) + "</p>" +
               priceHTML(p.price, p.mrp, "package__price") +
               '<div class="package__unit">' + esc(p.unit) + "</div>" +
               '<ul class="package__features">' +
                 (p.features || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
               "</ul>" +
               '<a class="btn btn--primary" href="' + esc(waLink(msg)) + '" target="_blank" rel="noopener">Ye package chahiye</a>' +
             "</article>";
    }).join("");
  }

  /* ---------- 7. Process ---------- */

  function renderProcess() {
    var box = $("#processGrid");
    if (!box) return;
    box.innerHTML = CFG.process.map(function (p) {
      return '<div class="process__item reveal">' +
               '<div class="process__step" aria-hidden="true">' + esc(p.step) + "</div>" +
               "<h3>" + esc(p.title) + "</h3><p>" + esc(p.desc) + "</p></div>";
    }).join("");
  }

  /* ---------- 8. Reviews ---------- */

  function renderReviews() {
    var box = $("#reviewsTrack");
    if (!box) return;
    box.innerHTML = CFG.testimonials.map(function (t) {
      var n = Math.max(0, Math.min(5, Number(t.stars) || 5));
      var stars = "★".repeat(n) + "☆".repeat(5 - n);
      var initial = esc(String(t.name || "?").trim().charAt(0).toUpperCase());

      return '<article class="review">' +
               '<div class="review__stars" aria-label="' + n + ' me se 5 star">' + stars + "</div>" +
               '<p class="review__text">' + esc(t.text) + "</p>" +
               '<div class="review__author">' +
                 '<div class="review__avatar" aria-hidden="true">' + initial + "</div><div>" +
                   '<div class="review__name">' + esc(t.name) + "</div>" +
                   '<div class="review__occasion">' + esc(t.occasion) + "</div>" +
               "</div></div></article>";
    }).join("");
  }

  /* ---------- 9. FAQ ---------- */

  function renderFaq() {
    var box = $("#faqList");
    if (!box) return;
    box.innerHTML = CFG.faqs.map(function (f, i) {
      return '<div class="faq__item reveal">' +
               '<button class="faq__q" aria-expanded="false" aria-controls="faqA' + i + '" id="faqQ' + i + '">' +
                 "<span>" + esc(f.q) + '</span><span class="faq__icon" aria-hidden="true"></span></button>' +
               '<div class="faq__a" id="faqA' + i + '" role="region" aria-labelledby="faqQ' + i + '">' +
                 "<p>" + esc(f.a) + "</p></div></div>";
    }).join("");
  }

  /* ---------- 10. Contacts ---------- */

  var IC = {
    wa: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.5-1.2-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.4-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.2.3-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
    ig: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  };

  function contactRow(icon, label, value, href) {
    var inner = '<span class="contact__icon" aria-hidden="true">' + icon + "</span><span>" +
                '<span class="contact__label">' + esc(label) + "</span>" +
                '<span class="contact__value">' + esc(value) + "</span></span>";
    return href ? '<li><a href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + "</a></li>"
                : "<li><span>" + inner + "</span></li>";
  }

  function renderContacts() {
    var s = CFG.site;
    var digits = String(s.whatsapp || "").replace(/\D/g, "");

    var aside = $("#bookingContacts");
    if (aside) {
      var rows = [
        contactRow(IC.wa, "WhatsApp pe seedhe baat", s.phone || digits,
                   waLink("Hello! Mujhe mehendi booking ke baare me jaankari chahiye.")),
        contactRow(IC.phone, "Call karein", s.phone || digits, "tel:+" + digits),
      ];
      if (s.email)     rows.push(contactRow(IC.mail, "Email", s.email, "mailto:" + s.email));
      if (s.instagram) rows.push(contactRow(IC.ig, "Instagram pe naye designs", "@" + (s.brand || "mehendi"), s.instagram));
      if (s.areas)     rows.push(contactRow(IC.pin, "Service area", s.areas, null));
      aside.innerHTML = rows.join("");
    }

    var fc = $("#footerContacts");
    if (fc) {
      var links = [
        '<a class="footer__contact" href="' + esc(waLink("Hello!")) + '" target="_blank" rel="noopener">' + IC.wa + " " + esc(s.phone || digits) + "</a>",
        '<a class="footer__contact" href="tel:+' + esc(digits) + '">' + IC.phone + " Call karein</a>",
      ];
      if (s.email) links.push('<a class="footer__contact" href="mailto:' + esc(s.email) + '">' + IC.mail + " " + esc(s.email) + "</a>");
      fc.innerHTML = links.join("");
    }

    var fs = $("#footerSocial");
    if (fs) {
      var social = [];
      if (s.instagram) social.push('<a href="' + esc(s.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + IC.ig + "</a>");
      if (s.facebook)  social.push('<a href="' + esc(s.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg></a>');
      if (s.youtube)   social.push('<a href="' + esc(s.youtube) + '" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23 12s0-3.5-.4-5.2a2.7 2.7 0 0 0-1.9-1.9C19 4.5 12 4.5 12 4.5s-7 0-8.7.4a2.7 2.7 0 0 0-1.9 1.9C1 8.5 1 12 1 12s0 3.5.4 5.2c.2.9.9 1.6 1.9 1.9 1.7.4 8.7.4 8.7.4s7 0 8.7-.4a2.7 2.7 0 0 0 1.9-1.9C23 15.5 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"/></svg></a>');
      social.push('<a href="' + esc(waLink("Hello!")) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + IC.wa + "</a>");
      fs.innerHTML = social.join("");
    }
  }

  /* ---------- 11. Form dropdowns ---------- */

  function renderFormOptions() {
    function fill(sel, list) {
      var el = $(sel);
      if (!el || !list) return;
      el.innerHTML = list.map(function (o) {
        return '<option value="' + esc(o) + '">' + esc(o) + "</option>";
      }).join("");
    }
    fill("#bOccasion", CFG.occasions);
    fill("#bService", CFG.serviceTypes);

    var d = $("#bDate");
    if (d) d.min = new Date().toISOString().split("T")[0];
  }

  /* ---------- Draft mode ---------- */

  function draftBanner() {
    var b = document.createElement("div");
    b.className = "draft-bar";
    b.innerHTML = 'Draft preview — ye sirf aapko dikh raha hai, client ko nahi. ' +
                  '<a href="admin.html">Admin kholein</a> · ' +
                  '<a href="' + location.pathname + '">Asli site</a>';
    document.body.appendChild(b);
  }

  function loadDraft() {
    return new Promise(function (resolve) {
      if (!isDraft) return resolve(false);

      var s = document.createElement("script");
      s.src = "js/admin-store.js";
      s.onload = function () {
        try {
          var d = window.Store && Store.load();
          if (!d || !d._seeded) return resolve(false);

          if (d.site && Object.keys(d.site).length) CFG.site = d.site;
          if (d.stats && d.stats.length)            CFG.stats = d.stats;
          if (d.gallery)                            CFG.gallery = d.gallery;
          if (d.packages)                           CFG.packages = d.packages;
          if (d.faqs)                               CFG.faqs = d.faqs;
          resolve(true);
        } catch (e) {
          console.warn("Draft padha nahi ja saka:", e);
          resolve(false);
        }
      };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }

  /* ---------- Sab chalao ---------- */

  function paint() {
    fillSiteText();
    renderStats();
    renderServices();
    renderGallery();
    renderPackages();
    renderProcess();
    renderReviews();
    renderFaq();
    renderContacts();
    renderFormOptions();
    fillWaLinks();
    document.dispatchEvent(new CustomEvent("content:ready"));
  }

  function init() {
    if (typeof SITE === "undefined") {
      console.error("config.js load nahi hua - check karo ki js/config.js file maujood hai.");
      return;
    }
    loadDraft().then(function (on) {
      if (on) draftBanner();
      paint();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

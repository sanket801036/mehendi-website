/* ============================================================
   ADMIN STORE - data aur photos browser me save karta hai
   ------------------------------------------------------------
   Data  : localStorage me (chhota JSON)
   Photos: IndexedDB me (blob - localStorage me photo nahi aati)

   Ye sab SIRF is browser me save hota hai. Client ko dikhane ke liye
   "Download" karke files repo me daalni padti hain.
   ============================================================ */
window.Store = (function () {
  "use strict";

  var DATA_KEY = "mehendi_admin_v1";
  var DB_NAME = "mehendi-admin";
  var DB_STORE = "images";
  var DB_HANDLES = "handles";   // project folder ka handle yahan rehta hai
  var MAX_SIDE = 1400;     // isse badi photo chhoti kar di jayegi
  var JPEG_Q = 0.82;

  /* ---------------- IndexedDB (photos + folder handle) ---------------- */

  var dbPromise = null;

  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains(DB_STORE))  d.createObjectStore(DB_STORE);
        if (!d.objectStoreNames.contains(DB_HANDLES)) d.createObjectStore(DB_HANDLES);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function txOn(store, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var t = d.transaction(store, mode);
        var req = fn(t.objectStore(store));
        t.oncomplete = function () { resolve(req && req.result); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  function tx(mode, fn) { return txOn(DB_STORE, mode, fn); }

  // Folder handle structured-clone hota hai, isliye seedha IndexedDB me rakh sakte hain
  function putHandle(h) {
    return txOn(DB_HANDLES, "readwrite", function (s) { return s.put(h, "projectDir"); });
  }
  function getHandle() {
    return txOn(DB_HANDLES, "readonly", function (s) { return s.get("projectDir"); });
  }
  function clearHandle() {
    return txOn(DB_HANDLES, "readwrite", function (s) { return s["delete"]("projectDir"); });
  }

  function putImage(name, blob) {
    return tx("readwrite", function (s) { return s.put(blob, name); });
  }

  function getImage(name) {
    return tx("readonly", function (s) { return s.get(name); });
  }

  function deleteImage(name) {
    return tx("readwrite", function (s) { return s["delete"](name); });
  }

  function imageNames() {
    return tx("readonly", function (s) { return s.getAllKeys(); });
  }

  function allImages() {
    return imageNames().then(function (names) {
      return Promise.all((names || []).map(function (n) {
        return getImage(n).then(function (b) { return { name: n, blob: b }; });
      }));
    });
  }

  /* ---------------- Photo compress ---------------- */

  // Phone ki 5MB photo ko ~200KB tak le aata hai, warna site bahut slow ho jayegi.
  function compress(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();

      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, MAX_SIDE / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);

        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);

        canvas.toBlob(function (blob) {
          if (blob) resolve({ blob: blob, width: cw, height: ch });
          else reject(new Error("Photo process nahi ho payi"));
        }, "image/jpeg", JPEG_Q);
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Ye file photo nahi lag rahi"));
      };
      img.src = url;
    });
  }

  /* ---------------- Data (localStorage) ---------------- */

  function blankData() {
    return { site: {}, gallery: [], packages: [], faqs: [], stats: [], _seeded: false };
  }

  function load() {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (!raw) return blankData();
      var d = JSON.parse(raw);
      var base = blankData();
      Object.keys(base).forEach(function (k) {
        if (d[k] === undefined) d[k] = base[k];
      });
      return d;
    } catch (e) {
      console.warn("Purana data padha nahi ja saka, naya shuru kar rahe hain.", e);
      return blankData();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return { ok: true };
    } catch (e) {
      // localStorage bhar gaya (5MB limit) - photos to IndexedDB me hain, phir bhi bacha lete hain
      return { ok: false, error: e.message || "Save nahi ho paya" };
    }
  }

  function reset() {
    localStorage.removeItem(DATA_KEY);
    return imageNames().then(function (names) {
      return Promise.all((names || []).map(deleteImage));
    });
  }

  /* ---------------- Pehli baar: config.js se data uthao ---------------- */

  function seedFromConfig(data) {
    if (data._seeded) return data;

    if (typeof SITE !== "undefined") {
      data.site = {
        brand: SITE.brand, artist: SITE.artist, artistShort: SITE.artistShort,
        tagline: SITE.tagline, city: SITE.city, seoArea: SITE.seoArea,
        postalCode: SITE.postalCode, areas: SITE.areas,
        whatsapp: SITE.whatsapp, phone: SITE.phone, email: SITE.email,
        instagram: SITE.instagram, facebook: SITE.facebook, youtube: SITE.youtube,
        web3formsKey: SITE.web3formsKey,
      };
      data.stats = (SITE.stats || []).map(function (s) {
        return { value: s.value, suffix: s.suffix, label: s.label };
      });
    }

    if (typeof GALLERY !== "undefined") {
      data.gallery = GALLERY.map(function (g) {
        return {
          id: uid(), file: g.file, category: g.category, alt: g.alt,
          title: g.title || "", price: g.price || null, mrp: g.mrp || null,
          builtin: true,   // config.js ke saath aayi thi, IndexedDB me nahi hai
        };
      });
    }

    if (typeof PACKAGES !== "undefined") {
      data.packages = PACKAGES.map(function (p) {
        return {
          id: uid(), name: p.name, price: p.price, mrp: p.mrp || null,
          unit: p.unit, desc: p.desc, features: (p.features || []).slice(),
          featured: !!p.featured,
        };
      });
    }

    if (typeof FAQS !== "undefined") {
      data.faqs = FAQS.map(function (f) { return { id: uid(), q: f.q, a: f.a }; });
    }

    data._seeded = true;
    save(data);
    return data;
  }

  function uid() {
    return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------------- Photo ka URL (preview ke liye) ---------------- */

  var urlCache = {};

  function imageURL(item) {
    // config.js ke saath aayi photo seedhe folder se
    if (item.builtin) return Promise.resolve("images/gallery/" + item.file);
    if (urlCache[item.file]) return Promise.resolve(urlCache[item.file]);

    return getImage(item.file).then(function (blob) {
      if (!blob) return "images/gallery/" + item.file;   // shayad export ho chuki hai
      urlCache[item.file] = URL.createObjectURL(blob);
      return urlCache[item.file];
    });
  }

  function forgetURL(file) {
    if (urlCache[file]) {
      URL.revokeObjectURL(urlCache[file]);
      delete urlCache[file];
    }
  }

  return {
    load: load, save: save, reset: reset, seedFromConfig: seedFromConfig, uid: uid,
    putImage: putImage, getImage: getImage, deleteImage: deleteImage,
    imageNames: imageNames, allImages: allImages,
    compress: compress, imageURL: imageURL, forgetURL: forgetURL,
    putHandle: putHandle, getHandle: getHandle, clearHandle: clearHandle,
    DATA_KEY: DATA_KEY,
  };
})();

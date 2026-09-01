/* ============================================================
   ADMIN AUTH - admin panel ka password lock
   ------------------------------------------------------------
   Password KABHI kahin save nahi hota - sirf uska PBKDF2 hash
   rehta hai. Hash se password wapas nikaalna practically namumkin
   hai.

   Imaandari se ek baat: ye site static hai, isliye ye lock
   "taala" hai, "tijori" nahi. Jo banda page ka source padhna
   jaanta hai wo ise bypass kar sakta hai. Ye casual logo ko
   rokta hai. Abhi iski ahmiyat kam hai kyunki admin kisi server
   pe kuch likhta hi nahi - wo sirf aapke browser aur aapke chune
   hue folder me kaam karta hai. Jis din GitHub token add hoga,
   us din ye lock aur strong protection dono zaroori ho jayenge.
   ============================================================ */
window.AdminAuth = (function () {
  "use strict";

  /* ---- Setup ke baad yahan hash aa jaata hai (password nahi) ---- */
  var CONFIG = {
    salt: "",
    hash: "",
    iterations: 210000,
  };

  var LS_KEY      = "mehendi_admin_auth";     // is browser ka hash
  var OPEN_KEY    = "mehendi_admin_open";     // is tab me khula hai
  var REMEMBER_KEY = "mehendi_admin_remember"; // "yaad rakho" ki expiry

  /* ---------------- Helpers ---------------- */

  function b64(buf) {
    var bytes = new Uint8Array(buf), s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function unb64(str) {
    var s = atob(str), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }

  /** PBKDF2-SHA256 - password ko dheere-dheere hash karta hai taaki
      guess karna mehnga pade. */
  function derive(password, saltBytes, iterations) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey(
      "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
    ).then(function (key) {
      return crypto.subtle.deriveBits({
        name: "PBKDF2", salt: saltBytes,
        iterations: iterations, hash: "SHA-256",
      }, key, 256);
    }).then(b64);
  }

  /** Poori lambai compare - jaldi return nahi karte */
  function sameHash(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ---------------- Kaunsa hash chalega ---------------- */

  // File wala hash pehle (wo har browser/deploy me kaam karta hai),
  // warna is browser ka localStorage wala.
  function active() {
    if (CONFIG.hash && CONFIG.salt) return CONFIG;
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.hash && o.salt) return o;
      }
    } catch (e) { /* kharab data - andekha kar do */ }
    return null;
  }

  function isConfigured() { return !!active(); }

  function available() {
    // crypto.subtle sirf https ya localhost pe milta hai
    return !!(window.crypto && crypto.subtle && crypto.subtle.deriveBits);
  }

  /* ---------------- Set / verify ---------------- */

  function setPassword(password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var saltB64 = b64(salt);
    return derive(password, salt, CONFIG.iterations).then(function (hash) {
      var rec = { salt: saltB64, hash: hash, iterations: CONFIG.iterations };
      CONFIG.salt = rec.salt;
      CONFIG.hash = rec.hash;
      try { localStorage.setItem(LS_KEY, JSON.stringify(rec)); } catch (e) { /* ignore */ }
      return rec;
    });
  }

  function verify(password) {
    var cfg = active();
    if (!cfg) return Promise.resolve(false);
    return derive(password, unb64(cfg.salt), cfg.iterations || 210000)
      .then(function (h) { return sameHash(h, cfg.hash); });
  }

  /* ---------------- Session ---------------- */

  function unlock(remember) {
    try {
      sessionStorage.setItem(OPEN_KEY, "1");
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, String(Date.now() + 30 * 24 * 3600 * 1000));
      }
    } catch (e) { /* ignore */ }
  }

  function isUnlocked() {
    try {
      if (sessionStorage.getItem(OPEN_KEY) === "1") return true;
      var till = Number(localStorage.getItem(REMEMBER_KEY) || 0);
      if (till && Date.now() < till) return true;
      if (till) localStorage.removeItem(REMEMBER_KEY);
    } catch (e) { /* ignore */ }
    return false;
  }

  function lock() {
    try {
      sessionStorage.removeItem(OPEN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    } catch (e) { /* ignore */ }
  }

  /* ---------------- File ka text (har browser me chalne ke liye) ---------------- */

  /** Jo hash abhi bana, usko admin-auth.js me daalne layak text banata hai. */
  function fileSnippet(rec) {
    return "  var CONFIG = {\n" +
           '    salt: "' + rec.salt + '",\n' +
           '    hash: "' + rec.hash + '",\n' +
           "    iterations: " + rec.iterations + ",\n" +
           "  };";
  }

  /** Chalti hui file ka poora naya text - CONFIG block badal ke. */
  function rewriteFile(originalText, rec) {
    return originalText.replace(
      /var CONFIG = \{[\s\S]*?\};/,
      fileSnippet(rec).replace(/^ {2}/, "")
    );
  }

  return {
    available: available,
    isConfigured: isConfigured,
    setPassword: setPassword,
    verify: verify,
    unlock: unlock,
    isUnlocked: isUnlocked,
    lock: lock,
    fileSnippet: fileSnippet,
    rewriteFile: rewriteFile,
  };
})();

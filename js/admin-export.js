/* ============================================================
   ADMIN EXPORT - config.js banata hai aur sab kuch ZIP me deta hai
   ------------------------------------------------------------
   ZIP khud banate hain (store method, bina compression ke) taaki
   koi bahar ki library na chahiye - photos already JPEG hain,
   unko dobara compress karne ka koi fayda bhi nahi.
   ============================================================ */
window.Exporter = (function () {
  "use strict";

  /* ---------------- config.js ka text ---------------- */

  function q(v) {
    // JS string literal - quotes aur newline safe
    return JSON.stringify(v == null ? "" : String(v));
  }

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? String(n) : "null";
  }

  // Price number bhi ho sakta hai aur "Custom" jaisa text bhi
  function priceLit(v) {
    if (v === "" || v == null) return "null";
    return Number.isFinite(Number(v)) ? String(Number(v)) : q(v);
  }

  function buildConfig(data) {
    var s = data.site || {};
    var L = [];

    L.push("/* ============================================================");
    L.push("   CONFIG - admin panel se banayi gayi file");
    L.push("   Banane ki tareekh: " + new Date().toLocaleString("en-IN"));
    L.push("   ------------------------------------------------------------");
    L.push("   Ise haath se bhi edit kar sakte ho, ya admin.html se dobara");
    L.push("   export kar sakte ho.");
    L.push("   ============================================================ */");
    L.push("");
    L.push("const SITE = {");
    L.push("  brand:       " + q(s.brand) + ",");
    L.push("  artist:      " + q(s.artist) + ",");
    L.push("  artistShort: " + q(s.artistShort) + ",");
    L.push("  tagline:     " + q(s.tagline) + ",");
    L.push("");
    L.push("  city:       " + q(s.city) + ",");
    L.push("  seoArea:    " + q(s.seoArea) + ",");
    L.push("  postalCode: " + q(s.postalCode) + ",");
    L.push("  areas:      " + q(s.areas) + ",");
    L.push("");
    L.push("  whatsapp: " + q(s.whatsapp) + ",");
    L.push("  phone:    " + q(s.phone) + ",");
    L.push("  email:    " + q(s.email) + ",");
    L.push("");
    L.push("  instagram: " + q(s.instagram) + ",");
    L.push("  facebook:  " + q(s.facebook) + ",");
    L.push("  youtube:   " + q(s.youtube) + ",");
    L.push("");
    L.push("  web3formsKey: " + q(s.web3formsKey) + ",");
    L.push("");
    L.push("  stats: [");
    (data.stats || []).forEach(function (st) {
      L.push("    { value: " + num(st.value) + ", suffix: " + q(st.suffix) +
             ", label: " + q(st.label) + " },");
    });
    L.push("  ],");
    L.push("};");
    L.push("");

    L.push("const GALLERY = [");
    (data.gallery || []).forEach(function (g) {
      var parts = [
        "file: " + q(g.file),
        "category: " + q(g.category),
        "alt: " + q(g.alt),
      ];
      if (g.title) parts.push("title: " + q(g.title));
      if (g.price != null && g.price !== "") parts.push("price: " + priceLit(g.price));
      if (g.mrp != null && g.mrp !== "") parts.push("mrp: " + num(g.mrp));
      L.push("  { " + parts.join(", ") + " },");
    });
    L.push("];");
    L.push("");

    L.push("const GALLERY_FILTERS = [");
    var cats = ["all"];
    (data.gallery || []).forEach(function (g) {
      if (g.category && cats.indexOf(g.category) === -1) cats.push(g.category);
    });
    cats.forEach(function (c) {
      L.push("  { id: " + q(c) + ", label: " + q(c === "all" ? "Sab" : cap(c)) + " },");
    });
    L.push("];");
    L.push("");

    L.push("const PACKAGES = [");
    (data.packages || []).forEach(function (p) {
      L.push("  {");
      L.push("    name: " + q(p.name) + ",");
      L.push("    price: " + priceLit(p.price) + ",");
      if (p.mrp != null && p.mrp !== "") L.push("    mrp: " + num(p.mrp) + ",");
      L.push("    unit: " + q(p.unit) + ",");
      L.push("    desc: " + q(p.desc) + ",");
      L.push("    features: [" + (p.features || []).map(q).join(", ") + "],");
      L.push("    featured: " + (p.featured ? "true" : "false") + ",");
      L.push("  },");
    });
    L.push("];");
    L.push("");

    // Reviews admin me nahi hain - purani file se jaise the waise rakh dete hain
    L.push("const TESTIMONIALS = " + jsonish(typeof TESTIMONIALS !== "undefined" ? TESTIMONIALS : []) + ";");
    L.push("");

    L.push("const FAQS = [");
    (data.faqs || []).forEach(function (f) {
      L.push("  { q: " + q(f.q) + ", a: " + q(f.a) + " },");
    });
    L.push("];");
    L.push("");

    L.push("const SERVICES = " + jsonish(typeof SERVICES !== "undefined" ? SERVICES : []) + ";");
    L.push("");
    L.push("const PROCESS = " + jsonish(typeof PROCESS !== "undefined" ? PROCESS : []) + ";");
    L.push("");
    L.push("const OCCASIONS = " + jsonish(typeof OCCASIONS !== "undefined" ? OCCASIONS : []) + ";");
    L.push("const SERVICE_TYPES = " + jsonish(typeof SERVICE_TYPES !== "undefined" ? SERVICE_TYPES : []) + ";");
    L.push("");

    return L.join("\n");
  }

  function cap(s) {
    return String(s).charAt(0).toUpperCase() + String(s).slice(1);
  }

  function jsonish(v) {
    return JSON.stringify(v, null, 2).replace(/\n/g, "\n");
  }

  /* ---------------- ZIP (store method) ---------------- */

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosTime(d) {
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
  }
  function dosDate(d) {
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  }

  function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
  function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

  /** files: [{name, bytes:Uint8Array}] -> Blob */
  function makeZip(files) {
    var now = new Date();
    var chunks = [];
    var central = [];
    var offset = 0;
    var enc = new TextEncoder();

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var crc = crc32(f.bytes);
      var size = f.bytes.length;

      var local = [].concat(
        u32(0x04034b50), u16(20), u16(0), u16(0),
        u16(dosTime(now)), u16(dosDate(now)),
        u32(crc), u32(size), u32(size),
        u16(nameBytes.length), u16(0)
      );
      chunks.push(new Uint8Array(local), nameBytes, f.bytes);

      central.push({
        header: [].concat(
          u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
          u16(dosTime(now)), u16(dosDate(now)),
          u32(crc), u32(size), u32(size),
          u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
          u32(0), u32(offset)
        ),
        nameBytes: nameBytes,
      });

      offset += local.length + nameBytes.length + size;
    });

    var centralStart = offset;
    var centralSize = 0;
    central.forEach(function (c) {
      chunks.push(new Uint8Array(c.header), c.nameBytes);
      centralSize += c.header.length + c.nameBytes.length;
    });

    chunks.push(new Uint8Array([].concat(
      u32(0x06054b50), u16(0), u16(0),
      u16(files.length), u16(files.length),
      u32(centralSize), u32(centralStart), u16(0)
    )));

    return new Blob(chunks, { type: "application/zip" });
  }

  /* ---------------- Download ---------------- */

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function blobBytes(blob) {
    return blob.arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }

  /** Sab kuch ek ZIP me: config.js + nayi photos */
  function exportAll(data) {
    var configText = buildConfig(data);
    var files = [{
      name: "js/config.js",
      bytes: new TextEncoder().encode(configText),
    }];

    // sirf wahi photos jo admin se add hui hain (builtin wali repo me pehle se hain)
    var needed = (data.gallery || []).filter(function (g) { return !g.builtin; });

    return Promise.all(needed.map(function (g) {
      return Store.getImage(g.file).then(function (blob) {
        if (!blob) return null;
        return blobBytes(blob).then(function (bytes) {
          return { name: "images/gallery/" + g.file, bytes: bytes };
        });
      });
    })).then(function (imgs) {
      imgs.filter(Boolean).forEach(function (f) { files.push(f); });
      var zip = makeZip(files);
      var stamp = new Date().toISOString().slice(0, 10);
      download(zip, "mehendi-site-" + stamp + ".zip");
      return { files: files.length, photos: files.length - 1, size: zip.size };
    });
  }

  function exportConfigOnly(data) {
    var text = buildConfig(data);
    download(new Blob([text], { type: "text/javascript" }), "config.js");
    return text;
  }

  return {
    buildConfig: buildConfig,
    exportAll: exportAll,
    exportConfigOnly: exportConfigOnly,
    makeZip: makeZip,
    download: download,
  };
})();

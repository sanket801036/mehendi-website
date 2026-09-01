/* ============================================================
   ADMIN - UI ka saara kaam
   tabs, designs/packages/faq/stats/contact ka add-edit-delete,
   photo upload, discount calculation, export
   ============================================================ */
(function () {
  "use strict";

  function $(s, r)   { return (r || document).querySelector(s); }
  function $$(s, r)  { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  var data = Store.seedFromConfig(Store.load());
  var activeCat = "all";

  /* ---------------- Save + toast ---------------- */

  var toastTimer = null;
  function toast(msg, type) {
    var t = $("#toast");
    t.textContent = msg;
    t.className = "ad-toast is-on" + (type ? " is-" + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "ad-toast"; }, 3200);
  }

  function persist() {
    var r = Store.save(data);
    if (!r.ok) toast("Save nahi hua: " + r.error, "err");
    return r.ok;
  }

  /* ---------------- Folder me likhna (asli site turant update) ---------------- */

  var publishTimer = null;

  /** Folder juda ho to har save ke baad config.js + nayi photos disk pe likh do. */
  function autoPublish(quiet) {
    if (!window.Publish || !Publish.isConnected()) return;
    clearTimeout(publishTimer);
    publishTimer = setTimeout(function () {
      Publish.run(data).then(function (r) {
        if (!quiet) {
          toast(r.photos
            ? "Website me save ho gaya (" + r.photos + " nayi photo)"
            : "Website me save ho gaya", "ok");
        }
      }).catch(function (err) {
        toast("Website me likh nahi paye: " + (err.message || err), "err");
      });
    }, 400);
  }

  function setLinkUI(state) {
    var status = $("#linkStatus");
    var btn = $("#btnConnect");
    var notice = $("#notice");
    var ok = $("#noticeOk");

    if (state.connected) {
      status.textContent = state.name;
      status.className = "ad-link is-on";
      btn.textContent = "Folder badlo";
      notice.hidden = true;
      $("#okFolder").textContent = state.name;
      ok.hidden = false;
    } else if (state.needsPermission) {
      status.textContent = "permission chahiye";
      status.className = "ad-link";
      btn.textContent = "Folder jodo";
      ok.hidden = true;
    } else {
      status.textContent = "";
      status.className = "ad-link";
      btn.textContent = "Folder jodo";
      ok.hidden = true;
    }
  }

  /* ---------------- Field errors ---------------- */

  function setErr(inputId, msg) {
    var input = document.getElementById(inputId);
    var slot = $('[data-err="' + inputId + '"]');
    if (input && input.closest(".ad-field")) {
      input.closest(".ad-field").classList.toggle("has-error", !!msg);
    }
    if (slot) slot.textContent = msg || "";
  }

  function clearErrs(form) {
    $$(".ad-err", form).forEach(function (e) { e.textContent = ""; });
    $$(".ad-field", form).forEach(function (f) { f.classList.remove("has-error"); });
  }

  /* ---------------- Discount ---------------- */

  function discountPct(mrp, price) {
    var m = Number(mrp), p = Number(price);
    if (!Number.isFinite(m) || !Number.isFinite(p) || m <= 0 || p < 0 || p >= m) return null;
    return Math.round((1 - p / m) * 100);
  }

  function wireDiscount(mrpId, priceId, boxId) {
    function update() {
      var box = $("#" + boxId);
      var m = $("#" + mrpId).value, p = $("#" + priceId).value;
      if (m === "" || p === "") { box.hidden = true; return; }

      var mm = Number(m), pp = Number(p);
      if (pp >= mm && mm > 0) {
        box.hidden = false;
        box.className = "ad-discount is-bad";
        box.textContent = "Aaj ka price original se kam hona chahiye, tabhi discount dikhega.";
        return;
      }
      var pct = discountPct(m, p);
      if (pct == null) { box.hidden = true; return; }
      box.hidden = false;
      box.className = "ad-discount";
      box.innerHTML = "Client ko dikhega: <b>" + pct + "% OFF</b> &nbsp;—&nbsp; " +
                      "<s>₹" + mm.toLocaleString("en-IN") + "</s> " +
                      "<b>₹" + pp.toLocaleString("en-IN") + "</b> " +
                      "(₹" + (mm - pp).toLocaleString("en-IN") + " ki bachat)";
    }
    $("#" + mrpId).addEventListener("input", update);
    $("#" + priceId).addEventListener("input", update);
    return update;
  }

  /* ---------------- Tabs ---------------- */

  $$(".ad-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".ad-tab").forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      $$(".ad-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.dataset.panel === tab.dataset.tab);
      });
    });
  });

  $("#noticeX").addEventListener("click", function () { $("#notice").hidden = true; });

  /* ============================================================
     DESIGNS
     ============================================================ */

  var dm = $("#designModal");
  var editingDesign = null;
  var pendingBlob = null;      // nayi chuni hui photo (abhi save nahi hui)
  var updateDDiscount = wireDiscount("dMrp", "dPrice", "dDiscount");

  function categories() {
    var c = [];
    data.gallery.forEach(function (g) {
      if (g.category && c.indexOf(g.category) === -1) c.push(g.category);
    });
    return c;
  }

  function renderCats() {
    var bar = $("#galleryCats");
    var cats = categories();
    if (cats.indexOf(activeCat) === -1 && activeCat !== "all") activeCat = "all";

    bar.innerHTML = ['all'].concat(cats).map(function (c) {
      var n = c === "all" ? data.gallery.length
                          : data.gallery.filter(function (g) { return g.category === c; }).length;
      return '<button class="ad-chip' + (c === activeCat ? " is-active" : "") + '" data-cat="' +
             esc(c) + '">' + esc(c === "all" ? "Sab" : c) + " (" + n + ")</button>";
    }).join("");

    $("#catList").innerHTML = cats.map(function (c) {
      return '<option value="' + esc(c) + '"></option>';
    }).join("");
  }

  $("#galleryCats").addEventListener("click", function (e) {
    var chip = e.target.closest(".ad-chip");
    if (!chip) return;
    activeCat = chip.dataset.cat;
    renderCats();
    renderGallery();
  });

  function renderGallery() {
    var list = $("#galleryList");
    var items = activeCat === "all" ? data.gallery
              : data.gallery.filter(function (g) { return g.category === activeCat; });

    $("#cGallery").textContent = data.gallery.length;
    $("#galleryEmpty").hidden = data.gallery.length !== 0;

    list.innerHTML = items.map(function (g) {
      var pct = discountPct(g.mrp, g.price);
      var price = "";
      if (g.price != null && g.price !== "") {
        price = '<div class="ad-card__price"><span class="ad-card__now">₹' +
                Number(g.price).toLocaleString("en-IN") + "</span>" +
                (g.mrp ? '<span class="ad-card__mrp">₹' + Number(g.mrp).toLocaleString("en-IN") + "</span>" : "") +
                "</div>";
      }
      return '<article class="ad-card" data-id="' + esc(g.id) + '">' +
               '<div class="ad-card__img">' +
                 '<img alt="' + esc(g.alt) + '" data-img="' + esc(g.id) + '">' +
                 '<span class="ad-card__cat">' + esc(g.category) + "</span>" +
                 (pct ? '<span class="ad-card__off">' + pct + "% OFF</span>" : "") +
               "</div>" +
               '<div class="ad-card__body">' +
                 (g.title ? '<div class="ad-card__title">' + esc(g.title) + "</div>" : "") +
                 '<div class="ad-card__alt">' + esc(g.alt) + "</div>" +
                 price +
               "</div>" +
               '<div class="ad-card__acts">' +
                 '<button class="ad-mini" data-edit="' + esc(g.id) + '">Badlein</button>' +
                 '<button class="ad-mini ad-mini--del" data-del="' + esc(g.id) + '">Hataayein</button>' +
               "</div>" +
             "</article>";
    }).join("");

    // photos IndexedDB se lagao
    items.forEach(function (g) {
      Store.imageURL(g).then(function (url) {
        var img = $('[data-img="' + g.id + '"]', list);
        if (img) img.src = url;
      });
    });
  }

  $("#galleryList").addEventListener("click", function (e) {
    var ed = e.target.closest("[data-edit]");
    var dl = e.target.closest("[data-del]");
    if (ed) openDesign(ed.dataset.edit);
    if (dl) delDesign(dl.dataset.del);
  });

  function openDesign(id) {
    editingDesign = id ? data.gallery.filter(function (g) { return g.id === id; })[0] : null;
    pendingBlob = null;
    clearErrs($("#designForm"));

    $("#dmTitle").textContent = editingDesign ? "Design badlein" : "Naya design";
    $("#dCategory").value = editingDesign ? editingDesign.category : "";
    $("#dTitle").value    = editingDesign ? (editingDesign.title || "") : "";
    $("#dAlt").value      = editingDesign ? editingDesign.alt : "";
    $("#dMrp").value      = editingDesign && editingDesign.mrp != null ? editingDesign.mrp : "";
    $("#dPrice").value    = editingDesign && editingDesign.price != null ? editingDesign.price : "";

    var prev = $("#dPreview");
    if (editingDesign) {
      Store.imageURL(editingDesign).then(function (url) {
        prev.src = url; prev.hidden = false; $("#dropMsg").hidden = true;
      });
    } else {
      prev.removeAttribute("src"); prev.hidden = true; $("#dropMsg").hidden = false;
    }
    $("#dFileInfo").textContent = "Badi photo apne aap chhoti kar di jayegi (max 1400px, ~200KB)";

    updateDDiscount();
    dm.hidden = false;
    setTimeout(function () { $("#dCategory").focus(); }, 40);
  }

  function delDesign(id) {
    var g = data.gallery.filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    if (!confirm('"' + (g.title || g.alt || g.file) + '" hata dein?')) return;

    data.gallery = data.gallery.filter(function (x) { return x.id !== id; });
    persist();
    if (!g.builtin) {
      Store.forgetURL(g.file);
      Store.deleteImage(g.file);
    }
    renderCats(); renderGallery();
    toast("Design hata diya", "ok");
    if (!g.builtin && window.Publish && Publish.isConnected()) Publish.removeImage(g.file);
    autoPublish(true);
  }

  /* ---- photo chunna ---- */

  var drop = $("#drop");
  var fileInput = $("#dFile");

  drop.addEventListener("click", function () { fileInput.click(); });
  drop.addEventListener("dragover", function (e) {
    e.preventDefault(); drop.classList.add("is-over");
  });
  drop.addEventListener("dragleave", function () { drop.classList.remove("is-over"); });
  drop.addEventListener("drop", function (e) {
    e.preventDefault(); drop.classList.remove("is-over");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    setErr("dFile", "");
    if (!/^image\//.test(file.type)) { setErr("dFile", "Sirf photo file chaliye"); return; }

    var before = Math.round(file.size / 1024);
    $("#dFileInfo").textContent = "Photo process ho rahi hai...";

    Store.compress(file).then(function (res) {
      pendingBlob = res.blob;
      var after = Math.round(res.blob.size / 1024);
      $("#dFileInfo").textContent = before + " KB → " + after + " KB (" + res.width + "×" + res.height + ")";

      var prev = $("#dPreview");
      if (prev.dataset.tmp) URL.revokeObjectURL(prev.dataset.tmp);
      var url = URL.createObjectURL(res.blob);
      prev.dataset.tmp = url;
      prev.src = url;
      prev.hidden = false;
      $("#dropMsg").hidden = true;
    }).catch(function (err) {
      setErr("dFile", err.message || "Photo process nahi ho payi");
      $("#dFileInfo").textContent = "";
    });
  }

  function nextFileName(cat) {
    var base = String(cat || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Extension hata ke compare karte hain - warna "bridal-01.jpg" aur
    // "bridal-01.svg" dono ban jate aur folder me confusion hoti.
    var taken = data.gallery.map(function (g) {
      return String(g.file || "").replace(/\.[^.]+$/, "").toLowerCase();
    });
    var n = 1, stem;
    do {
      stem = base + "-" + String(n).padStart(2, "0");
      n++;
    } while (taken.indexOf(stem) !== -1);
    return stem + ".jpg";
  }

  $("#designForm").addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrs($("#designForm"));

    var cat = $("#dCategory").value.trim().toLowerCase();
    var alt = $("#dAlt").value.trim();
    var mrp = $("#dMrp").value.trim();
    var price = $("#dPrice").value.trim();
    var bad = null;

    if (!cat) { setErr("dCategory", "Category likhiye"); bad = bad || "dCategory"; }
    if (alt.length < 3) { setErr("dAlt", "Photo ka chhota description likhiye"); bad = bad || "dAlt"; }
    if (!editingDesign && !pendingBlob) { setErr("dFile", "Photo chuniye"); bad = bad || "dFile"; }
    if (price !== "" && mrp !== "" && Number(price) >= Number(mrp)) {
      setErr("dPrice", "Aaj ka price original se kam hona chahiye");
      bad = bad || "dPrice";
    }
    if (bad) { document.getElementById(bad).focus(); return; }

    var item = editingDesign || { id: Store.uid(), builtin: false };
    item.category = cat;
    item.title = $("#dTitle").value.trim();
    item.alt = alt;
    item.mrp = mrp === "" ? null : Number(mrp);
    item.price = price === "" ? null : Number(price);

    var work = Promise.resolve();

    if (pendingBlob) {
      // nayi photo aayi - purani (agar admin se thi) hata do, folder se bhi
      if (item.file && !item.builtin) {
        var oldFile = item.file;
        Store.forgetURL(oldFile);
        work = work.then(function () { return Store.deleteImage(oldFile); });
        if (window.Publish && Publish.isConnected()) {
          work = work.then(function () { return Publish.removeImage(oldFile); });
        }
      }
      item.file = nextFileName(cat);
      item.builtin = false;
      item.written = false;   // nayi file hai - publish ise dobara likhega
      var blob = pendingBlob;
      work = work.then(function () { return Store.putImage(item.file, blob); });
    }

    work.then(function () {
      if (!editingDesign) data.gallery.push(item);
      persist();
      renderCats(); renderGallery();
      dm.hidden = true;
      pendingBlob = null;
      toast(editingDesign ? "Design update ho gaya" : "Design add ho gaya", "ok");
      editingDesign = null;
      autoPublish(true);
    }).catch(function (err) {
      toast("Photo save nahi hui: " + (err.message || err), "err");
    });
  });

  $("#btnAddDesign").addEventListener("click", function () { openDesign(null); });

  /* ============================================================
     PACKAGES
     ============================================================ */

  var pm = $("#packageModal");
  var editingPkg = null;
  var updatePDiscount = wireDiscount("pMrp", "pPrice", "pDiscount");

  function renderPackages() {
    var list = $("#packageList");
    $("#cPackages").textContent = data.packages.length;
    $("#packageEmpty").hidden = data.packages.length !== 0;

    list.innerHTML = data.packages.map(function (p) {
      var pct = discountPct(p.mrp, p.price);
      // price "Custom" jaisa text bhi ho sakta hai - tab ₹ nahi lagate
      var now = Number.isFinite(Number(p.price)) && p.price !== ""
        ? "₹" + Number(p.price).toLocaleString("en-IN")
        : esc(p.price || "-");

      return '<div class="ad-row' + (p.featured ? " ad-row--featured" : "") + '">' +
               '<div class="ad-row__main">' +
                 '<div class="ad-row__title">' + esc(p.name) +
                   (p.featured ? '<span class="ad-tag">Popular</span>' : "") + "</div>" +
                 '<div class="ad-row__sub">' + esc(p.desc || "") + "</div>" +
               "</div>" +
               '<div class="ad-price">' +
                 '<span class="ad-price__now">' + now + "</span>" +
                 (pct ? '<span class="ad-price__mrp">₹' + Number(p.mrp).toLocaleString("en-IN") + "</span>" : "") +
                 (pct ? '<span class="ad-price__off">' + pct + "% OFF</span>" : "") +
               "</div>" +
               '<div class="ad-row__acts">' +
                 '<button class="ad-mini" data-edit="' + esc(p.id) + '">Badlein</button>' +
                 '<button class="ad-mini ad-mini--del" data-del="' + esc(p.id) + '">Hataayein</button>' +
               "</div>" +
             "</div>";
    }).join("");
  }

  $("#packageList").addEventListener("click", function (e) {
    var ed = e.target.closest("[data-edit]");
    var dl = e.target.closest("[data-del]");
    if (ed) openPkg(ed.dataset.edit);
    if (dl) {
      var p = data.packages.filter(function (x) { return x.id === dl.dataset.del; })[0];
      if (p && confirm('"' + p.name + '" package hata dein?')) {
        data.packages = data.packages.filter(function (x) { return x.id !== p.id; });
        persist(); renderPackages(); toast("Package hata diya", "ok"); autoPublish(true);
      }
    }
  });

  function openPkg(id) {
    editingPkg = id ? data.packages.filter(function (p) { return p.id === id; })[0] : null;
    clearErrs($("#packageForm"));

    $("#pmTitle").textContent = editingPkg ? "Package badlein" : "Naya package";
    $("#pName").value  = editingPkg ? editingPkg.name : "";
    $("#pUnit").value  = editingPkg ? (editingPkg.unit || "") : "se shuru";
    $("#pMrp").value   = editingPkg && editingPkg.mrp != null ? editingPkg.mrp : "";
    $("#pPrice").value = editingPkg && editingPkg.price != null ? editingPkg.price : "";
    $("#pDesc").value  = editingPkg ? (editingPkg.desc || "") : "";
    $("#pFeatures").value = editingPkg ? (editingPkg.features || []).join("\n") : "";
    $("#pFeatured").checked = editingPkg ? !!editingPkg.featured : false;

    updatePDiscount();
    pm.hidden = false;
    setTimeout(function () { $("#pName").focus(); }, 40);
  }

  $("#packageForm").addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrs($("#packageForm"));

    var name = $("#pName").value.trim();
    var price = $("#pPrice").value.trim();
    var mrp = $("#pMrp").value.trim();
    var bad = null;

    var priceIsNum = price !== "" && Number.isFinite(Number(price));

    if (!name) { setErr("pName", "Package ka naam likhiye"); bad = bad || "pName"; }
    if (price === "") { setErr("pPrice", "Price likhiye"); bad = bad || "pPrice"; }
    if (priceIsNum && mrp !== "" && Number(price) >= Number(mrp)) {
      setErr("pPrice", "Aaj ka price original se kam hona chahiye"); bad = bad || "pPrice";
    }
    if (bad) { document.getElementById(bad).focus(); return; }

    var p = editingPkg || { id: Store.uid() };
    p.name = name;
    p.unit = $("#pUnit").value.trim();
    // number ho to number, warna text ("Custom" jaisa) waise ka waisa
    p.price = priceIsNum ? Number(price) : price;
    p.mrp = mrp === "" || !priceIsNum ? null : Number(mrp);
    p.desc = $("#pDesc").value.trim();
    p.features = $("#pFeatures").value.split("\n")
      .map(function (s) { return s.trim(); }).filter(Boolean);
    p.featured = $("#pFeatured").checked;

    // "Popular" ek waqt me ek hi
    if (p.featured) {
      data.packages.forEach(function (o) { if (o !== p) o.featured = false; });
    }
    if (!editingPkg) data.packages.push(p);

    persist(); renderPackages();
    pm.hidden = true;
    toast(editingPkg ? "Package update ho gaya" : "Package add ho gaya", "ok");
    editingPkg = null;
    autoPublish(true);
  });

  $("#btnAddPackage").addEventListener("click", function () { openPkg(null); });

  /* ============================================================
     FAQ
     ============================================================ */

  var fm = $("#faqModal");
  var editingFaq = null;

  function renderFaqs() {
    var list = $("#faqList");
    $("#cFaqs").textContent = data.faqs.length;
    $("#faqEmpty").hidden = data.faqs.length !== 0;

    list.innerHTML = data.faqs.map(function (f) {
      return '<div class="ad-row">' +
               '<div class="ad-row__main">' +
                 '<div class="ad-row__title">' + esc(f.q) + "</div>" +
                 '<div class="ad-row__sub">' + esc(String(f.a).slice(0, 130)) +
                 (String(f.a).length > 130 ? "..." : "") + "</div>" +
               "</div>" +
               '<div class="ad-row__acts">' +
                 '<button class="ad-mini" data-edit="' + esc(f.id) + '">Badlein</button>' +
                 '<button class="ad-mini ad-mini--del" data-del="' + esc(f.id) + '">Hataayein</button>' +
               "</div>" +
             "</div>";
    }).join("");
  }

  $("#faqList").addEventListener("click", function (e) {
    var ed = e.target.closest("[data-edit]");
    var dl = e.target.closest("[data-del]");
    if (ed) openFaq(ed.dataset.edit);
    if (dl && confirm("Ye sawaal hata dein?")) {
      data.faqs = data.faqs.filter(function (x) { return x.id !== dl.dataset.del; });
      persist(); renderFaqs(); toast("Sawaal hata diya", "ok"); autoPublish(true);
    }
  });

  function openFaq(id) {
    editingFaq = id ? data.faqs.filter(function (f) { return f.id === id; })[0] : null;
    clearErrs($("#faqForm"));
    $("#fmTitle").textContent = editingFaq ? "Sawaal badlein" : "Naya sawaal";
    $("#fQ").value = editingFaq ? editingFaq.q : "";
    $("#fA").value = editingFaq ? editingFaq.a : "";
    fm.hidden = false;
    setTimeout(function () { $("#fQ").focus(); }, 40);
  }

  $("#faqForm").addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrs($("#faqForm"));
    var q = $("#fQ").value.trim(), a = $("#fA").value.trim();
    var bad = null;
    if (!q) { setErr("fQ", "Sawaal likhiye"); bad = bad || "fQ"; }
    if (!a) { setErr("fA", "Jawaab likhiye"); bad = bad || "fA"; }
    if (bad) { document.getElementById(bad).focus(); return; }

    var f = editingFaq || { id: Store.uid() };
    f.q = q; f.a = a;
    if (!editingFaq) data.faqs.push(f);

    persist(); renderFaqs();
    fm.hidden = true;
    toast(editingFaq ? "Sawaal update ho gaya" : "Sawaal add ho gaya", "ok");
    editingFaq = null;
    autoPublish(true);
  });

  $("#btnAddFaq").addEventListener("click", function () { openFaq(null); });

  /* ============================================================
     STATS - seedha inline edit
     ============================================================ */

  function renderStats() {
    $("#statList").innerHTML = data.stats.map(function (s, i) {
      return '<div class="ad-row">' +
               '<div class="ad-field" style="flex:0 0 110px"><label>Number</label>' +
                 '<input type="number" min="0" data-stat="' + i + '" data-k="value" value="' + esc(s.value) + '"></div>' +
               '<div class="ad-field" style="flex:0 0 90px"><label>Nishaan</label>' +
                 '<input type="text" maxlength="3" data-stat="' + i + '" data-k="suffix" value="' + esc(s.suffix) + '"></div>' +
               '<div class="ad-field ad-row__main"><label>Label</label>' +
                 '<input type="text" data-stat="' + i + '" data-k="label" value="' + esc(s.label) + '"></div>' +
               '<div class="ad-row__acts">' +
                 '<button class="ad-mini ad-mini--del" data-delstat="' + i + '">Hataayein</button>' +
               "</div>" +
             "</div>";
    }).join("");
  }

  $("#statList").addEventListener("input", function (e) {
    var inp = e.target.closest("[data-stat]");
    if (!inp) return;
    var s = data.stats[Number(inp.dataset.stat)];
    if (!s) return;
    s[inp.dataset.k] = inp.dataset.k === "value" ? Number(inp.value) : inp.value;
    persist();
    autoPublish(true);
  });

  $("#statList").addEventListener("click", function (e) {
    var d = e.target.closest("[data-delstat]");
    if (!d) return;
    data.stats.splice(Number(d.dataset.delstat), 1);
    persist(); renderStats(); toast("Number hata diya", "ok"); autoPublish(true);
  });

  $("#btnAddStat").addEventListener("click", function () {
    data.stats.push({ value: 0, suffix: "+", label: "Naya number" });
    persist(); renderStats();
  });

  /* ============================================================
     SITE / CONTACT
     ============================================================ */

  function fillSiteForm() {
    $$("[data-site]").forEach(function (inp) {
      var v = data.site[inp.dataset.site];
      inp.value = v == null ? "" : v;
    });
  }

  $("#siteForm").addEventListener("input", function (e) {
    var inp = e.target.closest("[data-site]");
    if (!inp) return;
    var key = inp.dataset.site;
    var val = inp.value.trim();

    if (key === "whatsapp") {
      var digits = val.replace(/\D/g, "");
      setErr("sWa", digits.length >= 10 && digits.length <= 15
        ? "" : "10-15 digit ka number, country code ke saath (jaise 919145671694)");
      data.site[key] = digits;
    } else if (key === "email") {
      setErr("sEmail", val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "Email sahi nahi lag rahi");
      data.site[key] = val;
    } else {
      data.site[key] = val;
    }
    persist();
    autoPublish(true);
  });

  /* ============================================================
     Modal band karna
     ============================================================ */

  $$(".ad-modal").forEach(function (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest("[data-close]")) modal.hidden = true;
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    $$(".ad-modal").forEach(function (m) { m.hidden = true; });
  });

  /* ============================================================
     EXPORT + RESET
     ============================================================ */

  $("#btnExport").addEventListener("click", function () {
    var btn = $("#btnExport");
    btn.disabled = true;
    btn.textContent = "ZIP ban rahi hai...";

    Exporter.exportAll(data).then(function (r) {
      toast("ZIP taiyaar — " + r.photos + " photo + config.js (" +
            Math.round(r.size / 1024) + " KB)", "ok");
    }).catch(function (err) {
      toast("Export fail: " + (err.message || err), "err");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Download (ZIP)";
    });
  });

  $("#btnReset").addEventListener("click", function () {
    if (!confirm("Admin ka saara data aur photos is browser se hat jayenge. Pakka?")) return;
    Store.reset().then(function () {
      location.reload();
    });
  });

  /* ---------------- Folder connect ---------------- */

  $("#btnConnect").addEventListener("click", function () {
    if (!Publish.supported()) {
      toast("Ye browser folder access support nahi karta. Chrome ya Edge use kijiye.", "err");
      return;
    }
    Publish.connect().then(function (name) {
      toast("Folder jud gaya: " + name, "ok");
      // jodte hi sab kuch ek baar likh do
      return Publish.run(data).then(function (r) {
        toast("Website update ho gayi (" + r.photos + " photo likhi)", "ok");
      });
    }).catch(function (err) {
      // user ne picker cancel kiya to chup rehna hai
      if (err && err.name === "AbortError") return;
      toast(err.message || String(err), "err");
    });
  });

  $("#noticeOkX").addEventListener("click", function () { $("#noticeOk").hidden = true; });

  Publish.onChange(setLinkUI);

  /* ============================================================
     START
     ============================================================ */

  renderCats();
  renderGallery();
  renderPackages();
  renderFaqs();
  renderStats();
  fillSiteForm();

  if (Publish.supported()) {
    // reload ke baad purana folder wapas jodne ki koshish (bina permission maange)
    Publish.restore(false).then(function (ok) {
      if (!ok) setLinkUI({ connected: false });
    });
  } else {
    $("#btnConnect").hidden = true;
    $("#notice").innerHTML = '<strong>Dhyan dijiye —</strong> ye browser folder access ' +
      'support nahi karta, isliye kaam sirf isi browser me save hoga. Seedha website me ' +
      'likhne ke liye <b>Chrome</b> ya <b>Edge</b> use kijiye, ya "Download (ZIP)" se files nikaliye.' +
      '<button class="ad-notice__x" id="noticeX2" aria-label="Band karein">&times;</button>';
    $("#noticeX2").addEventListener("click", function () { $("#notice").hidden = true; });
  }
})();

/* ============================================================
   ADMIN GATE - lock screen ka logic
   ------------------------------------------------------------
   Unlock hone par `admin:unlocked` event bhejta hai, jiska
   intezaar admin.js karta hai. Isse lock hone tak admin ka
   koi hissa chalta hi nahi.
   ============================================================ */
(function () {
  "use strict";

  function $(s) { return document.querySelector(s); }

  var gate      = $("#gate");
  var setupForm = $("#gateSetup");
  var loginForm = $("#gateLogin");
  var savedBox  = $("#gateSaved");

  function show(which) {
    setupForm.hidden = which !== "setup";
    loginForm.hidden = which !== "login";
    savedBox.hidden  = which !== "saved";
  }

  function setErr(id, msg) {
    var slot = document.querySelector('[data-err="' + id + '"]');
    var input = document.getElementById(id);
    if (slot) slot.textContent = msg || "";
    if (input && input.closest(".ad-field")) {
      input.closest(".ad-field").classList.toggle("has-error", !!msg);
    }
  }

  function open() {
    gate.hidden = true;
    document.body.classList.add("is-unlocked");
    document.dispatchEvent(new CustomEvent("admin:unlocked"));
  }

  /* ---------------- crypto na mile to lock skip ---------------- */

  if (!AdminAuth.available()) {
    // crypto.subtle sirf https/localhost pe milta hai. file:// se kholne par
    // password ban hi nahi sakta - to lock lagane ka dikhawa nahi karte.
    console.warn("Secure context nahi hai (https ya localhost chahiye) - admin lock band hai.");
    open();
    return;
  }

  /* ---------------- Kaunsi screen ---------------- */

  if (AdminAuth.isUnlocked() && AdminAuth.isConfigured()) {
    open();
  } else if (AdminAuth.isConfigured()) {
    show("login");
    setTimeout(function () { $("#gp").focus(); }, 60);
  } else {
    show("setup");
    setTimeout(function () { $("#gp1").focus(); }, 60);
  }

  /* ---------------- Pehli baar: password banao ---------------- */

  setupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setErr("gp2", "");

    var p1 = $("#gp1").value;
    var p2 = $("#gp2").value;

    if (p1.length < 6) { setErr("gp2", "Kam se kam 6 akshar rakhiye"); $("#gp1").focus(); return; }
    if (p1 !== p2)     { setErr("gp2", "Dono password alag hain"); $("#gp2").focus(); return; }

    var btn = setupForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Ban raha hai...";

    AdminAuth.setPassword(p1).then(function (rec) {
      $("#gp1").value = "";
      $("#gp2").value = "";
      AdminAuth.unlock(true);
      return afterSetup(rec);
    }).catch(function (err) {
      setErr("gp2", "Password set nahi hua: " + (err.message || err));
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Password set karein";
    });
  });

  /**
   * Password ka hash file me bhi jaana chahiye, warna doosre browser me
   * ya deploy ke baad lock kaam nahi karega. Folder juda ho to hum khud
   * likh dete hain; warna user ko snippet copy karne ko dete hain.
   */
  function afterSetup(rec) {
    var canWrite = window.Publish && Publish.isConnected();

    if (!canWrite) {
      $("#gateSnippet").value = AdminAuth.fileSnippet(rec);
      $("#gateSavedMsg").textContent =
        "Is browser me lag gaya. Har jagah chale iske liye niche wala hissa " +
        "js/admin-auth.js me CONFIG ki jagah paste kar dijiye.";
      show("saved");
      return;
    }

    return fetch("js/admin-auth.js")
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var updated = AdminAuth.rewriteFile(txt, rec);
        if (updated === txt) throw new Error("file me CONFIG block nahi mila");
        return Publish.writeText("js/admin-auth.js", updated);
      })
      .then(function () {
        $("#gateSavedMsg").textContent =
          "js/admin-auth.js me likh diya gaya hai. Ab ye password har browser me " +
          "aur deploy ke baad bhi chalega. Git push karna na bhooliyega.";
        $("#gateSnippet").value = AdminAuth.fileSnippet(rec);
        show("saved");
      })
      .catch(function (err) {
        $("#gateSnippet").value = AdminAuth.fileSnippet(rec);
        $("#gateSavedMsg").textContent =
          "Is browser me lag gaya, par file me likh nahi paye (" + (err.message || err) +
          "). Niche wala hissa js/admin-auth.js me CONFIG ki jagah paste kar dijiye.";
        show("saved");
      });
  }

  $("#gateCopy").addEventListener("click", function () {
    var ta = $("#gateSnippet");
    ta.select();
    var done = function () { $("#gateCopy").textContent = "Copy ho gaya"; };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand("copy"); done(); });
    } else {
      document.execCommand("copy");
      done();
    }
  });

  $("#gateDone").addEventListener("click", open);

  /* ---------------- Login ---------------- */

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setErr("gp", "");

    var pw = $("#gp").value;
    if (!pw) { setErr("gp", "Password daaliye"); return; }

    var btn = loginForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Check ho raha hai...";

    AdminAuth.verify(pw).then(function (ok) {
      if (!ok) {
        setErr("gp", "Password galat hai");
        $("#gp").value = "";
        $("#gp").focus();
        return;
      }
      AdminAuth.unlock($("#gpRemember").checked);
      $("#gp").value = "";
      open();
    }).catch(function (err) {
      setErr("gp", "Check nahi ho paya: " + (err.message || err));
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Kholiye";
    });
  });

  /* ---------------- Password bhool gaye ---------------- */

  $("#gateForget").addEventListener("click", function (e) {
    e.preventDefault();
    var msg = "Naya password banane ke liye purana lock hataana padega.\n\n" +
              "Aapke designs, rates aur photos bilkul surakshit rahenge — sirf " +
              "password reset hoga.\n\nAage badhein?";
    if (!confirm(msg)) return;

    try { localStorage.removeItem("mehendi_admin_auth"); } catch (err) { /* ignore */ }
    AdminAuth.lock();

    // File me hash pada ho to localStorage hataane se kaam nahi chalega
    if (AdminAuth.isConfigured()) {
      alert("Password js/admin-auth.js file me set hai, isliye browser se hataane " +
            "se reset nahi hoga.\n\nUs file me CONFIG ki salt aur hash khaali kar " +
            'dijiye (salt: "", hash: ""), phir page refresh kijiye.');
      return;
    }
    location.reload();
  });

  /* ---------------- Lock button ---------------- */

  document.addEventListener("admin:unlocked", function () {
    var btn = document.getElementById("btnLock");
    if (!btn) return;
    btn.addEventListener("click", function () {
      AdminAuth.lock();
      location.reload();
    });
  });
})();

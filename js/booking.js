/* ============================================================
   BOOKING - form validation, WhatsApp message aur email
   ============================================================ */
(function () {
  "use strict";

  function $(sel) { return document.querySelector(sel); }

  var form      = $("#bookingForm");
  var statusBox = $("#bookingStatus");
  var btnWa     = $("#btnWhatsapp");
  var btnEmail  = $("#btnEmail");

  if (!form) return;

  /* ---------- Status message ---------- */
  function setStatus(msg, type) {
    if (!statusBox) return;
    statusBox.textContent = msg || "";
    statusBox.classList.remove("is-ok", "is-err");
    if (type) statusBox.classList.add(type === "ok" ? "is-ok" : "is-err");
  }

  /* ---------- Field-level error ---------- */
  function setError(id, msg) {
    var input = document.getElementById(id);
    if (!input) return;
    var field = input.closest(".field");
    var slot  = document.querySelector('[data-error-for="' + id + '"]');

    if (field) field.classList.toggle("has-error", Boolean(msg));
    if (slot)  slot.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function clearErrors() {
    ["bName", "bPhone", "bDate", "bPeople"].forEach(function (id) { setError(id, ""); });
    setStatus("");
  }

  /* ---------- Validation ---------- */
  function validate() {
    clearErrors();

    var data = {
      name:     ($("#bName").value     || "").trim(),
      phone:    ($("#bPhone").value    || "").trim(),
      date:     ($("#bDate").value     || "").trim(),
      occasion: ($("#bOccasion").value || "").trim(),
      service:  ($("#bService").value  || "").trim(),
      people:   ($("#bPeople").value   || "").trim(),
      city:     ($("#bCity").value     || "").trim(),
      message:  ($("#bMessage").value  || "").trim(),
    };

    var firstBad = null;

    // Naam
    if (data.name.length < 2) {
      setError("bName", "Apna naam likhiye");
      firstBad = firstBad || "bName";
    }

    // Phone - 10 digit (0 ya +91 prefix chalega)
    var digits = data.phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === "0")   digits = digits.slice(1);

    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("bPhone", "10 digit ka sahi mobile number daaliye");
      firstBad = firstBad || "bPhone";
    } else {
      data.phone = digits;
    }

    // Date - aaj ya aage ki honi chahiye
    if (!data.date) {
      setError("bDate", "Mehendi ki date chuniye");
      firstBad = firstBad || "bDate";
    } else {
      var picked = new Date(data.date + "T00:00:00");
      var today  = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(picked.getTime())) {
        setError("bDate", "Date sahi nahi hai");
        firstBad = firstBad || "bDate";
      } else if (picked < today) {
        setError("bDate", "Guzri hui date nahi chalegi - aage ki date chuniye");
        firstBad = firstBad || "bDate";
      }
    }

    // Log ki sankhya
    var people = Number(data.people);
    if (data.people && (!Number.isFinite(people) || people < 1 || people > 500)) {
      setError("bPeople", "1 se 500 ke beech koi number daaliye");
      firstBad = firstBad || "bPeople";
    }

    if (firstBad) {
      setStatus("Kuch jaankari adhuri hai - upar dekh lijiye.", "err");
      var el = document.getElementById(firstBad);
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return null;
    }

    return data;
  }

  /* ---------- Date ko padhne layak banao ---------- */
  function prettyDate(iso) {
    try {
      return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    } catch (e) {
      return iso;
    }
  }

  /* ---------- WhatsApp message ---------- */
  function buildMessage(d) {
    var lines = [
      "*Mehendi Booking Enquiry*",
      "",
      "*Naam:* " + d.name,
      "*Phone:* " + d.phone,
      "*Date:* " + prettyDate(d.date),
      "*Occasion:* " + d.occasion,
      "*Service:* " + d.service,
      "*Kitne log:* " + (d.people || "1"),
    ];
    if (d.city)    lines.push("*Area:* " + d.city);
    if (d.message) lines.push("", "*Message:* " + d.message);
    lines.push("", "(" + (SITE.brand || "website") + " ki website se bheja gaya)");
    return lines.join("\n");
  }

  /* ---------- Submit -> WhatsApp ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var data = validate();
    if (!data) return;

    var url = window.waLink
      ? window.waLink(buildMessage(data))
      : "https://wa.me/" + String(SITE.whatsapp || "").replace(/\D/g, "") +
        "?text=" + encodeURIComponent(buildMessage(data));

    var win = window.open(url, "_blank", "noopener");

    if (win) {
      setStatus("WhatsApp khul raha hai - bas send dabana baaki hai.", "ok");
    } else {
      // popup blocker ne roka - to link de dete hain
      setStatus("Popup block ho gaya. WhatsApp kholne ke liye niche wale button pe click kijiye.", "err");
      showFallbackLink(url);
    }
  });

  function showFallbackLink(url) {
    if (!statusBox || statusBox.querySelector("a")) return;
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "btn btn--primary";
    a.style.marginTop = ".8rem";
    a.textContent = "WhatsApp kholein";
    statusBox.appendChild(document.createElement("br"));
    statusBox.appendChild(a);
  }

  /* ---------- Email (Web3Forms) ---------- */
  function initEmail() {
    // key khaali hai to email button dikhega hi nahi - WhatsApp phir bhi chalta rahega
    if (!btnEmail || !SITE.web3formsKey) return;

    btnEmail.hidden = false;

    btnEmail.addEventListener("click", function () {
      var data = validate();
      if (!data) return;

      btnEmail.disabled = true;
      btnEmail.textContent = "Bheja jaa raha hai...";
      setStatus("");

      var payload = {
        access_key: SITE.web3formsKey,
        subject:    "Nayi Mehendi Booking - " + data.name + " (" + prettyDate(data.date) + ")",
        from_name:  (SITE.brand || "Mehendi") + " Website",
        Naam:       data.name,
        Phone:      data.phone,
        Date:       prettyDate(data.date),
        Occasion:   data.occasion,
        Service:    data.service,
        Log:        data.people || "1",
        Area:       data.city || "-",
        Message:    data.message || "-",
      };

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json(); })
        .then(function (res) {
          if (res && res.success) {
            setStatus("Ho gaya! Aapki enquiry mil gayi - hum jaldi reply karenge.", "ok");
            form.reset();
            var d = $("#bDate");
            if (d) d.min = new Date().toISOString().split("T")[0];
          } else {
            setStatus("Email nahi ja paayi. Kripya WhatsApp wala button use kijiye.", "err");
          }
        })
        .catch(function () {
          setStatus("Internet me dikkat lag rahi hai. Kripya WhatsApp wala button use kijiye.", "err");
        })
        .then(function () {
          btnEmail.disabled = false;
          btnEmail.textContent = "Email pe bhejo";
        });
    });
  }

  /* ---------- Type karte hi purana error hata do ---------- */
  ["bName", "bPhone", "bDate", "bPeople"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", function () { setError(id, ""); });
  });

  document.addEventListener("content:ready", initEmail);
})();

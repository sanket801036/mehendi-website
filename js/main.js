/* ============================================================
   MAIN - saari interactions
   nav, scroll-reveal, gallery filter + lightbox,
   FAQ accordion, stat counters, reviews slider, back-to-top
   ============================================================ */
(function () {
  "use strict";

  function $(sel, root)    { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     1. NAVBAR - scroll state, mobile menu, active link
     ============================================================ */
  function initNav() {
    var nav     = $("#nav");
    var toggle  = $("#navToggle");
    var links   = $("#navLinks");
    if (!nav || !toggle || !links) return;

    function closeMenu() {
      links.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menu kholein");
      document.body.classList.remove("no-scroll");
    }

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menu band karein" : "Menu kholein");
      document.body.classList.toggle("no-scroll", open);
    });

    // link pe click -> menu band
    $all("a", links).forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });

    // ESC se menu band
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    // menu ke bahar click -> band
    document.addEventListener("click", function (e) {
      if (!links.classList.contains("is-open")) return;
      if (nav.contains(e.target)) return;
      closeMenu();
    });

    // window bada ho jaye to mobile menu reset
    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) closeMenu();
    });

    // scroll pe navbar ka background
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ============================================================
     2. ACTIVE LINK - konsa section screen pe hai
     ============================================================ */
  function initActiveLink() {
    var navLinks = $all('#navLinks a[href^="#"]').filter(function (a) {
      return !a.classList.contains("nav__cta");
    });
    var sections = navLinks
      .map(function (a) { return $(a.getAttribute("href")); })
      .filter(Boolean);

    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ============================================================
     3. SCROLL REVEAL
     ============================================================ */
  function initReveal() {
    var items = $all(".reveal");
    if (!items.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        // ek hi row ke items thoda stagger ho ke aayein
        setTimeout(function () { entry.target.classList.add("is-visible"); }, i * 70);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     4. STAT COUNTERS
     ============================================================ */
  function initCounters() {
    var nums = $all("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = Number(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";

      if (reducedMotion) {
        el.textContent = target.toLocaleString("en-IN") + suffix;
        return;
      }

      var duration = 1600;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // ease-out
        el.textContent = Math.round(target * eased).toLocaleString("en-IN") + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================================
     5. GALLERY FILTER
     ============================================================ */
  function initGalleryFilter() {
    var filters = $all("#galleryFilters .filter");
    var items   = $all("#galleryGrid .gallery__item");
    if (!filters.length || !items.length) return;

    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");

        filters.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", String(on));
        });

        items.forEach(function (item) {
          var show = cat === "all" || item.getAttribute("data-cat") === cat;
          item.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  /* ============================================================
     6. LIGHTBOX
     ============================================================ */
  function initLightbox() {
    var box     = $("#lightbox");
    var img     = $("#lbImage");
    var caption = $("#lbCaption");
    var btnPrev = $("#lbPrev");
    var btnNext = $("#lbNext");
    var btnClose= $("#lbClose");
    if (!box || !img || typeof GALLERY === "undefined") return;

    var current = 0;
    var lastFocused = null;

    // sirf wahi photos jo abhi filter ke baad dikh rahi hain
    function visibleIndexes() {
      return $all("#galleryGrid .gallery__item")
        .filter(function (el) { return !el.classList.contains("is-hidden"); })
        .map(function (el) { return Number(el.getAttribute("data-index")); });
    }

    function show(index) {
      var item = GALLERY[index];
      if (!item) return;
      current = index;
      img.src = "images/gallery/" + item.file;
      img.alt = item.alt || "";
      caption.textContent = item.alt || "";
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      box.hidden = false;
      document.body.classList.add("no-scroll");
      btnClose.focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove("no-scroll");
      if (lastFocused) lastFocused.focus();
    }

    function move(dir) {
      var vis = visibleIndexes();
      if (!vis.length) return;
      var at = vis.indexOf(current);
      var next = at === -1 ? 0 : (at + dir + vis.length) % vis.length;
      show(vis[next]);
    }

    // gallery items pe click (delegation - render ke baad bhi kaam karega)
    var grid = $("#galleryGrid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var item = e.target.closest(".gallery__item");
        if (!item) return;
        open(Number(item.getAttribute("data-index")));
      });
    }

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { move(-1); });
    btnNext.addEventListener("click", function () { move(1); });

    // backdrop pe click -> band
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    // keyboard
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape")     { close(); }
      if (e.key === "ArrowLeft")  { move(-1); }
      if (e.key === "ArrowRight") { move(1); }
      // focus lightbox ke andar hi rahe
      if (e.key === "Tab") {
        var focusable = [btnClose, btnPrev, btnNext];
        var i = focusable.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? i - 1 : i + 1;
        focusable[(next + focusable.length) % focusable.length].focus();
      }
    });

    // mobile pe swipe
    var startX = 0;
    box.addEventListener("touchstart", function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) move(dx > 0 ? -1 : 1);
    }, { passive: true });
  }

  /* ============================================================
     7. FAQ ACCORDION
     ============================================================ */
  function initFaq() {
    var list = $("#faqList");
    if (!list) return;

    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".faq__q");
      if (!btn) return;

      var item   = btn.closest(".faq__item");
      var panel  = $("#" + btn.getAttribute("aria-controls"));
      var isOpen = item.classList.contains("is-open");

      // ek waqt me ek hi khula rahe
      $all(".faq__item", list).forEach(function (other) {
        other.classList.remove("is-open");
        var q = $(".faq__q", other);
        var a = $(".faq__a", other);
        if (q) q.setAttribute("aria-expanded", "false");
        if (a) a.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });

    // window resize pe khule panel ki height dobara naapo
    window.addEventListener("resize", function () {
      var open = $(".faq__item.is-open .faq__a", list);
      if (open) open.style.maxHeight = open.scrollHeight + "px";
    });
  }

  /* ============================================================
     8. REVIEWS SLIDER
     ============================================================ */
  function initReviews() {
    var viewport = $("#reviewsViewport");
    var track    = $("#reviewsTrack");
    var prev     = $("#reviewsPrev");
    var next     = $("#reviewsNext");
    if (!viewport || !track) return;

    function cardStep() {
      var card = $(".review", track);
      if (!card) return 320;
      var gap = parseFloat(getComputedStyle(track).gap) || 22;
      return card.getBoundingClientRect().width + gap;
    }

    function scrollBy(dir) {
      viewport.scrollBy({ left: dir * cardStep(), behavior: reducedMotion ? "auto" : "smooth" });
    }

    if (prev) prev.addEventListener("click", function () { scrollBy(-1); });
    if (next) next.addEventListener("click", function () { scrollBy(1); });

    // auto-scroll - hover/touch/focus pe ruk jaata hai
    if (reducedMotion) return;

    var timer = null;
    function start() {
      stop();
      timer = setInterval(function () {
        var atEnd = viewport.scrollLeft + viewport.clientWidth >= track.scrollWidth - 10;
        if (atEnd) {
          viewport.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollBy(1);
        }
      }, 4500);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    ["mouseenter", "touchstart", "focusin"].forEach(function (ev) {
      viewport.addEventListener(ev, stop, { passive: true });
    });
    ["mouseleave", "focusout"].forEach(function (ev) {
      viewport.addEventListener(ev, start, { passive: true });
    });

    // tab background me ho to chalne ki zaroorat nahi
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });

    start();
  }

  /* ============================================================
     9. BACK TO TOP
     ============================================================ */
  function initBackToTop() {
    var btn = $("#backToTop");
    if (!btn) return;

    function onScroll() {
      btn.hidden = window.scrollY < 600;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  /* ============================================================
     INIT - render.js ke content banane ke baad
     ============================================================ */
  function init() {
    initNav();
    initActiveLink();
    initReveal();
    initCounters();
    initGalleryFilter();
    initLightbox();
    initFaq();
    initReviews();
    initBackToTop();
  }

  document.addEventListener("content:ready", init);
})();

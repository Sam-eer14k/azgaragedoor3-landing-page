/* AZ Garage Door - interactions
   Vanilla, no dependencies. Everything here degrades to a working page if JS
   fails, and everything heavy checks prefers-reduced-motion first. */

(function () {
  "use strict";

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduce = mqReduce.matches;
  mqReduce.addEventListener?.("change", function (e) { reduce = e.matches; });

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- year */
  var yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------- hero on load */
  var hero = $(".hero");
  if (hero) requestAnimationFrame(function () { hero.classList.add("is-ready"); });

  /* ------------------------------------------------- header shrink state */
  var hdr = $(".hdr");
  var onScrollHdr = function () {
    if (hdr) hdr.classList.toggle("is-stuck", window.scrollY > 24);
  };

  /* ---------------------------------------------------------- scroll spy */
  var navLinks = $$(".nav__list a[href^='#']");
  var spyTargets = navLinks
    .map(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      return el ? { a: a, el: el } : null;
    })
    .filter(Boolean);

  var spy = function () {
    if (!spyTargets.length) return;
    var line = window.scrollY + window.innerHeight * 0.3;
    var active = null;
    spyTargets.forEach(function (t) {
      if (t.el.offsetTop <= line) active = t;
    });
    spyTargets.forEach(function (t) {
      t.a.setAttribute("aria-current", t === active ? "true" : "false");
    });
  };

  /* --------------------------------------------------- back to top + ring */
  var top = $("#top-btn");
  var ring = top ? $(".fg", top) : null;
  var CIRC = 0;
  if (ring) {
    var r = ring.r.baseVal.value;
    CIRC = 2 * Math.PI * r;
    ring.style.strokeDasharray = CIRC;
    ring.style.strokeDashoffset = CIRC;
  }

  var onScrollTop = function () {
    if (!top) return;
    var y = window.scrollY;
    top.classList.toggle("is-on", y > 400);
    if (ring) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(y / max, 1) : 0;
      ring.style.strokeDashoffset = CIRC * (1 - p);
    }
  };

  if (top) {
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* one rAF-throttled scroll handler for all of the above */
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollHdr();
      onScrollTop();
      spy();
      ticking = false;
    });
  }, { passive: true });
  onScrollHdr(); onScrollTop(); spy();

  /* -------------------------------------------------------- mobile drawer */
  var drawer = $("#drawer");
  var burger = $("#burger");
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var f = drawer.querySelector("a, button");
    if (f) f.focus();
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (burger) {
    burger.addEventListener("click", function () {
      drawer.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });
  }
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]") || e.target.classList.contains("drawer__scrim")) closeDrawer();
    });
    /* focus trap */
    drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = $$("a[href], button:not([disabled])", drawer).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href").length > 1) closeDrawer();
  });

  /* ------------------------------------------------------ magnetic buttons */
  if (mqFine.matches && !reduce) {
    $$(".mag").forEach(function (m) {
      var raf = null;
      m.addEventListener("mousemove", function (e) {
        var b = m.getBoundingClientRect();
        var dx = (e.clientX - (b.left + b.width / 2)) * 0.26;
        var dy = (e.clientY - (b.top + b.height / 2)) * 0.34;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          m.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
        });
      });
      m.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        m.style.transition = "transform .45s cubic-bezier(.34,1.46,.64,1)";
        m.style.transform = "";
        window.setTimeout(function () { m.style.transition = ""; }, 460);
      });
    });
  }

  /* --------------------------------------------------------- custom cursor */
  if (mqFine.matches && !reduce) {
    var dot = document.createElement("div");
    var rng = document.createElement("div");
    dot.className = "cur"; rng.className = "cur-ring";
    dot.setAttribute("aria-hidden", "true");
    rng.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(rng);
    document.body.classList.add("cur-on");

    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
    }, { passive: true });

    (function loop() {
      /* lerp gives the ring its trailing feel */
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      rng.style.transform = "translate(" + rx.toFixed(2) + "px," + ry.toFixed(2) + "px)";
      requestAnimationFrame(loop);
    })();

    document.addEventListener("mouseover", function (e) {
      var hotY = e.target.closest("a, button, [role='button']");
      var hot = e.target.closest(".promise__c, .bento__c, .rev__c, .svc__p, .faq__i, .est__o");
      rng.classList.toggle("is-hot-y", !!hotY);
      rng.classList.toggle("is-hot", !hotY && !!hot);
    });

    document.addEventListener("mouseleave", function () {
      dot.style.opacity = rng.style.opacity = "0";
    });
    document.addEventListener("mouseenter", function () {
      dot.style.opacity = rng.style.opacity = "";
    });
  }

  /* --------------------------------------------------------- scroll reveal */
  var revs = $$("[data-rv], [data-rv-stag]");
  if (revs.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      revs.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -50px" });
      revs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------------------------------------- count up + rail fills */
  function whenSeen(el, fn) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        fn();
        o.disconnect();
      });
    }, { threshold: 0.35 });
    o.observe(el);
  }

  $$("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    whenSeen(el, function () {
      if (reduce) { el.textContent = target.toLocaleString() + "+"; return; }
      var t0 = performance.now(), dur = 1500;
      (function tick(t) {
        var p = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString() + "+";
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    });
  });

  $$(".tl, .proc").forEach(function (el) {
    whenSeen(el, function () { el.classList.add("is-in"); });
  });

  /* ------------------------------------------------------------- services */
  var svc = $("#svc");
  if (svc) {
    svc.addEventListener("click", function (e) {
      var btn = e.target.closest(".svc__btn");
      if (!btn) return;
      var panel = btn.closest(".svc__p");
      var open = panel.getAttribute("data-open") === "true";
      $$(".svc__p", svc).forEach(function (p) {
        p.setAttribute("data-open", "false");
        $(".svc__btn", p).setAttribute("aria-expanded", "false");
      });
      if (!open) {
        panel.setAttribute("data-open", "true");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  }

  /* ------------------------------------------------------------ estimator */
  var est = $("#est");
  if (est) {
    var fig = $("#estFig"), note = $("#estNote");
    var pick = function (o) {
      $$(".est__o", est).forEach(function (b) {
        b.setAttribute("aria-checked", b === o ? "true" : "false");
      });
      fig.textContent = o.getAttribute("data-price");
      note.textContent = o.getAttribute("data-note");
    };
    est.addEventListener("click", function (e) {
      var o = e.target.closest(".est__o");
      if (o) pick(o);
    });
    /* radio-group keyboard behaviour */
    est.addEventListener("keydown", function (e) {
      if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].indexOf(e.key) < 0) return;
      var all = $$(".est__o", est);
      var i = all.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var next = (e.key === "ArrowDown" || e.key === "ArrowRight")
        ? (i + 1) % all.length
        : (i - 1 + all.length) % all.length;
      all[next].focus();
      pick(all[next]);
    });
    var first = $(".est__o", est);
    if (first) pick(first);
  }

  /* -------------------------------------------------------- troubleshooter */
  var tro = $("#tro");
  if (tro) {
    /* Each node is either a question with options, or a verdict.
       Answers are safety-first: anything involving a spring stops the user. */
    var FLOW = {
      start: {
        q: "What is the door doing right now?",
        step: "Question 1 of 2",
        fill: 33,
        opts: [
          { t: "It will not open at all", go: "stuck" },
          { t: "I heard a loud bang", go: "bang" },
          { t: "It is crooked or off its track", go: "track" },
          { t: "My car is shut inside", go: "trapped" }
        ]
      },
      stuck: {
        q: "Does the opener motor run when you press the button?",
        step: "Question 2 of 2",
        fill: 66,
        opts: [
          { t: "The motor runs but the door does not move", go: "gear" },
          { t: "Nothing happens at all", go: "power" },
          { t: "It starts, then reverses straight back up", go: "sensor" }
        ]
      },
      bang: {
        end: true, level: "stop", title: "Leave the door alone",
        body: "A bang like that is almost always a torsion spring letting go. The door is now far heavier than it looks and the opener cannot take that weight. Do not try to lift it, and do not run the opener again.",
        warn: true
      },
      trapped: {
        end: true, level: "stop", title: "Call, do not force it",
        body: "If the door will not lift by hand, something is holding the weight and forcing it can drop the door. Call us and say the car is shut in, and that call goes to the front of the list.",
        warn: true
      },
      track: {
        end: true, level: "stop", title: "Stop using the door",
        body: "A door sitting crooked has usually jumped a roller out of the track, and running the opener from there bends the track and the panels. Unplug the opener at the ceiling and leave it where it is.",
        warn: true
      },
      gear: {
        end: true, level: "care", title: "Probably the opener, not the door",
        body: "A motor that runs while nothing moves is usually a stripped drive gear or a disconnected trolley. The door itself is likely fine. Opener repair starts at $129.",
        warn: false
      },
      power: {
        end: true, level: "ok", title: "Two things worth checking first",
        body: "Check the opener is still plugged in at the ceiling and that the wall switch has power, because a tripped breaker is a common and free fix. If both are fine, the logic board or the wall button has failed and we can quote that on the phone.",
        warn: false
      },
      sensor: {
        end: true, level: "ok", title: "Usually the safety sensors",
        body: "A door that reverses immediately is doing its job: the two sensors near the floor are not seeing each other. Check for a box or a broom in the way and that both little lights are steady. A realignment runs $89 if it needs one.",
        warn: false
      }
    };

    var bar = $(".tro__bar i", tro);
    var body = $(".tro__in", tro);

    function render(key) {
      var n = FLOW[key];
      if (!n) return;
      bar.style.width = (n.end ? 100 : n.fill) + "%";

      if (!n.end) {
        body.innerHTML =
          '<p class="tro__step">' + n.step + "</p>" +
          '<h3 class="tro__q">' + n.q + "</h3>" +
          '<div class="tro__opts">' +
          n.opts.map(function (o) {
            return '<button class="tro__o" type="button" data-go="' + o.go + '">' + o.t + "</button>";
          }).join("") +
          "</div>";
      } else {
        var labels = { stop: "Do not use the door", care: "Get it looked at", ok: "Safe to check yourself" };
        var icons = {
          stop: '<path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/>',
          care: '<path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0z"/>',
          ok: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.4 2.4 4.6-5"/>'
        };
        body.innerHTML =
          '<div class="tro__ans">' +
            '<span class="tro__verdict" data-level="' + n.level + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' + icons[n.level] + "</svg>" +
              labels[n.level] +
            "</span>" +
            '<h3 class="tro__q">' + n.title + "</h3>" +
            "<p>" + n.body + "</p>" +
            (n.warn
              ? '<div class="tro__warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0z"/></svg>' +
                "<span>Never try to adjust, wind or release a torsion spring yourself. They hold enough tension to break bones, and the tools to do it safely are not the ones in a household toolbox.</span></div>"
              : "") +
            '<div class="tro__acts">' +
              '<a class="btn" href="tel:4808211111">Call 480-821-1111</a>' +
              '<button class="tro__again" type="button" data-go="start">Start over</button>' +
            "</div>" +
          "</div>";
      }
      var h = body.querySelector("h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }

    tro.addEventListener("click", function (e) {
      var b = e.target.closest("[data-go]");
      if (b) render(b.getAttribute("data-go"));
    });
    render("start");
  }

  /* ------------------------------------------------------------ area map */
  var area = $("#area");
  if (area) {
    var setZone = function (z) {
      $$(".chip", area).forEach(function (c) {
        c.classList.toggle("is-on", c.getAttribute("data-zone") === z);
      });
      $$("[data-z]", area).forEach(function (n) {
        n.classList.toggle("is-on", n.getAttribute("data-z") === z);
      });
    };
    $$(".chip", area).forEach(function (c) {
      var z = c.getAttribute("data-zone");
      c.addEventListener("mouseenter", function () { setZone(z); });
      c.addEventListener("focus", function () { setZone(z); });
      c.addEventListener("click", function () { setZone(z); });
    });
    area.addEventListener("mouseleave", function () { setZone(null); });
  }

  /* ------------------------------------------------------ reviews carousel */
  var rail = $("#revRail");
  if (rail) {
    var prev = $("#revPrev"), next = $("#revNext");
    var step = function () {
      var c = rail.querySelector(".rev__c");
      return c ? c.offsetWidth + 18 : 340;
    };
    var sync = function () {
      if (!prev) return;
      var max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
    };
    if (prev) prev.addEventListener("click", function () {
      rail.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      rail.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" });
    });
    rail.addEventListener("scroll", sync, { passive: true });
    sync();

    /* drag to scroll */
    var down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      down = true; moved = 0;
      sx = e.clientX; sl = rail.scrollLeft;
      rail.classList.add("is-drag");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var d = e.clientX - sx;
      moved = Math.abs(d);
      rail.scrollLeft = sl - d;
    });
    window.addEventListener("pointerup", function (e) {
      if (!down) return;
      down = false;
      rail.classList.remove("is-drag");
      /* swallow the click that follows a real drag */
      if (moved > 6) {
        var kill = function (ev) { ev.preventDefault(); ev.stopPropagation(); };
        window.addEventListener("click", kill, { capture: true, once: true });
        window.setTimeout(function () {
          window.removeEventListener("click", kill, { capture: true });
        }, 40);
      }
    });

    /* gentle auto-advance, paused on hover, focus or drag */
    if (!reduce) {
      var timer = null;
      var play = function () {
        stop();
        timer = window.setInterval(function () {
          var max = rail.scrollWidth - rail.clientWidth - 2;
          if (rail.scrollLeft >= max) rail.scrollTo({ left: 0, behavior: "smooth" });
          else rail.scrollBy({ left: step(), behavior: "smooth" });
        }, 5200);
      };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      rail.addEventListener("mouseenter", stop);
      rail.addEventListener("mouseleave", play);
      rail.addEventListener("focusin", stop);
      rail.addEventListener("pointerdown", stop);
      document.addEventListener("visibilitychange", function () {
        document.hidden ? stop() : play();
      });
      whenSeen(rail, play);
    }
  }

  /* ----------------------------------------------------------------- faq */
  document.addEventListener("click", function (e) {
    var q = e.target.closest(".faq__q");
    if (!q) return;
    var item = q.parentNode;
    var open = item.classList.contains("is-open");
    $$(".faq__i").forEach(function (el) {
      el.classList.remove("is-open");
      $(".faq__q", el).setAttribute("aria-expanded", "false");
    });
    if (!open) {
      item.classList.add("is-open");
      q.setAttribute("aria-expanded", "true");
    }
  });
})();

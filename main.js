(function () {
  "use strict";
  // REM Colombia — main.js
  // Vanilla JS puro (sin dependencias externas: nada que descargar,
  // nada que se rompa si no hay internet). Cada init está aislado
  // con safe() para que un fallo no tumbe el resto del sitio.

  var data = window.__BRAND__ || {};
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  // Progressive enhancement: si JS carga, desactivamos el modo no-js.
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  function revealWithObserver(elements, options, timeoutMs) {
    if (!elements?.length) return;

    if (!("IntersectionObserver" in window) || reduced) {
      elements.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, options || { threshold: 0.05 });

    elements.forEach(function (el) { io.observe(el); });

    // Red de seguridad: evita que algo quede oculto por un fallo del observer.
    setTimeout(function () {
      elements.forEach(function (el) { el.classList.add("is-visible"); });
    }, timeoutMs || 6000);
  }

  /* ---------- Barra de progreso de lectura ---------- */
  function initReadingProgress() {
    var fill = $("#reading-progress-fill");
    if (!fill) return;
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      fill.style.width = pct + "%";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- Conteo animado de las cifras del hero ---------- */
  function initCountUp() {
    var items = $$(".count-up");
    if (!items.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute("data-count-to"), 10);
      if (!target || reduced) { el.textContent = String(target || el.textContent); return; }
      var duration = 1200;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.round(eased * target));
        if (progress < 1) window.requestAnimationFrame(step);
        else el.textContent = String(target);
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach(function (el) { el.textContent = el.getAttribute("data-count-to"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    items.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      items.forEach(function (el) { el.textContent = el.getAttribute("data-count-to"); });
    }, 6000);
  }

  /* ---------- Header: fondo sólido al hacer scroll ---------- */
  function initHeaderScroll() {
    var header = $("#site-header");
    if (!header) return;
    function update() {
      if (window.scrollY > 12) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Menú móvil ---------- */
  function initNavToggle() {
    var toggle = $("#nav-toggle");
    var nav = $("#main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Reveal on scroll (con temporizador de seguridad) ---------- */
  function initReveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    revealWithObserver(items, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }, 6000);
  }

  /* ---------- Barras de proceso (50% / 50%) ---------- */
  function initProcessBars() {
    var bars = $$(".process-bar");
    if (!bars.length) return;

    revealWithObserver(bars, { threshold: 0.05 }, 6000);
  }

  /* ---------- Carrusel de aliados: desplazamiento automático + control manual ---------- */
  function initAlliesCarousel() {
    var carousel = $("#allies-carousel");
    var track = $("#allies-track");
    var prevBtn = $("#allies-prev");
    var nextBtn = $("#allies-next");
    if (!carousel || !track) return;

    var items = $$("li", track);
    if (!items.length) return;

    function cloneSet() {
      items.forEach(function (li) {
        var clone = li.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.classList.remove("reveal");
        clone.removeAttribute("data-reveal");
        $$("a, button", clone).forEach(function (el) { el.setAttribute("tabindex", "-1"); });
        track.appendChild(clone);
      });
    }

    if (!reduced) {
      // Se triplica el set (no solo se duplica) para que el loop infinito
      // funcione sin saltos tanto hacia adelante (autoplay) como hacia
      // atrás (flecha "anterior"), con margen de sobra en ambos sentidos.
      cloneSet();
      cloneSet();
      carousel.scrollLeft = track.scrollWidth / 3;
    }

    var paused = false;
    var resumeTimer = null;
    var speed = 0.35; // px por frame — desplazamiento suave, no apresurado
    var remainder = 0; // acumula la fracción de píxel: scrollLeft solo admite enteros

    function pause() { paused = true; }
    function resume() { paused = false; }
    function pauseThenResume(delay) {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(resume, delay);
    }

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("touchstart", pause, { passive: true });
    carousel.addEventListener("touchend", function () { pauseThenResume(2000); }, { passive: true });
    carousel.addEventListener("focusin", pause);
    carousel.addEventListener("focusout", resume);

    function wrap() {
      var third = track.scrollWidth / 3;
      if (carousel.scrollLeft >= third * 2) {
        carousel.scrollLeft -= third;
      } else if (carousel.scrollLeft <= 0) {
        carousel.scrollLeft += third;
      }
    }

    function step() {
      if (!paused && !reduced) {
        var total = speed + remainder;
        var whole = Math.trunc(total);
        remainder = total - whole;
        if (whole !== 0) {
          carousel.scrollLeft += whole;
          wrap();
        }
      }
      requestAnimationFrame(step);
    }

    function cardStep() {
      var card = $(".ally-card", track);
      var gap = 16; // 1rem
      return card ? card.getBoundingClientRect().width + gap : 236;
    }

    function goTo(direction) {
      carousel.scrollBy({ left: direction * cardStep(), behavior: reduced ? "auto" : "smooth" });
      pauseThenResume(3000);
      if (!reduced) setTimeout(wrap, 450);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(1); });

    if (!reduced) requestAnimationFrame(step);
  }

  /* ---------- Botón flotante de WhatsApp: aparece tras un pequeño scroll ---------- */
  function initWhatsappFloat() {
    var btn = $(".whatsapp-float");
    if (!btn) return;
    function update() {
      if (window.scrollY > 320) btn.classList.add("is-visible");
      else btn.classList.remove("is-visible");
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Año dinámico en el footer ---------- */
  function initYear() {
    var el = $("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function buildInternalPayload(currentForm) {
    return {
      name: currentForm.name ? currentForm.name.value : "",
      institucion: currentForm.institucion ? currentForm.institucion.value : "",
      email: currentForm.email ? currentForm.email.value : "",
      phone: currentForm.phone ? currentForm.phone.value : "",
      message: currentForm.message ? currentForm.message.value : "",
      consent: !!currentForm.consent?.checked
    };
  }

  function buildFormRequest(providerName, cfgData, currentForm) {
    if (providerName === "web3forms") {
      if (!cfgData.accessKey || cfgData.accessKey.indexOf("REEMPLAZAR") === 0) {
        return { request: null, missingConfig: true };
      }
      var web3Data = new FormData(currentForm);
      web3Data.append("access_key", cfgData.accessKey);
      return {
        request: fetch(cfgData.endpoint || "https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: web3Data
        }),
        missingConfig: false
      };
    }

    return {
      request: fetch(cfgData.endpoint || "/api/contact", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildInternalPayload(currentForm))
      }),
      missingConfig: false
    };
  }

  /* ---------- Formulario de contacto (Web3Forms o endpoint propio) ---------- */
  function initContactForm() {
    var form = $("#contact-form");
    var status = $("#form-status");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (form.botcheck?.checked) return; // honeypot anti-spam

      var consent = $("#f-consent");
      if (consent && !consent.checked) {
        setStatus("Debe autorizar el tratamiento de datos personales para continuar.", "error");
        return;
      }

      var cfg = (data.form) || {};
      var provider = cfg.provider || "web3forms";
      var submitBtn = $("#form-submit");
      var originalLabel = submitBtn ? submitBtn.textContent : "";

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Enviando..."; }
      setStatus("Enviando su mensaje...", "");

      var requestState = buildFormRequest(provider, cfg, form);
      if (requestState.missingConfig) {
        setStatus("El formulario aún no tiene configurada la clave de envío. Revise el archivo LEEME.txt para activarlo (toma 2 minutos).", "error");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        return;
      }

      requestState.request
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json?.success) {
            setStatus("Gracias, hemos recibido su mensaje. Le responderemos muy pronto.", "ok");
            form.reset();
          } else {
            setStatus("No fue posible enviar el mensaje. Intente de nuevo o escríbanos por WhatsApp.", "error");
          }
        })
        .catch(function () {
          setStatus("No hay conexión a internet o el envío falló. Puede escribirnos directamente por WhatsApp o correo.", "error");
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        });
    });

    function setStatus(msg, state) {
      if (!status) return;
      status.textContent = msg;
      if (state) status.dataset.state = state;
      else delete status.dataset.state;
    }
  }

  /* ---------- Anclas: desplazamiento suave con offset del header fijo ---------- */
  function initAnchorOffset() {
    var header = $("#site-header");
    if (!header) return;
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = header.offsetHeight + 12;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  function boot() {
    safe(initReadingProgress, "initReadingProgress");
    safe(initCountUp, "initCountUp");
    safe(initHeaderScroll, "initHeaderScroll");
    safe(initNavToggle, "initNavToggle");
    safe(initReveals, "initReveals");
    safe(initProcessBars, "initProcessBars");
    safe(initWhatsappFloat, "initWhatsappFloat");
    safe(initAlliesCarousel, "initAlliesCarousel");
    safe(initYear, "initYear");
    safe(initContactForm, "initContactForm");
    safe(initAnchorOffset, "initAnchorOffset");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

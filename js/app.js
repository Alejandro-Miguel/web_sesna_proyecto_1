/* ==========================================================================
   Guías y documentos · lógica
   Sin dependencias. Secciones:
     1. Utilidades e iconos
     2. Render de la carpeta (Vista 2)
     3. Router por hash + transición tarjeta → carpeta
     4. Modales (video / síntesis)
     5. Descargas (placeholder) y aviso
     6. Pausa de animaciones fuera de pantalla
     7. Arranque
   ========================================================================== */
(function () {
  'use strict';

  /* 1. Utilidades e iconos ---------------------------------------------- */
  var DATA = window.SITE_DATA;
  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canVT = typeof document.startViewTransition === 'function';

  // Seguridad · todo HTML generado pasa por una única política Trusted Types ("app").
  // Con la CSP `require-trusted-types-for 'script'` el navegador rechaza cualquier
  // otra asignación a innerHTML. Los datos ya llegan escapados con esc().
  var ttPolicy = window.trustedTypes && window.trustedTypes.createPolicy
    ? window.trustedTypes.createPolicy('app', { createHTML: function (s) { return s; } })
    : null;
  function setHTML(el, html) { el.innerHTML = ttPolicy ? ttPolicy.createHTML(html) : html; }

  // Seguridad · solo URLs relativas, http(s) o ancla. Bloquea javascript:, data:, etc.
  // (location.protocol permite además la vista previa local abierta como file://)
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u || u.charAt(0) === '#') return u || '#';
    try {
      var url = new URL(u, location.href);
      return (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === location.protocol) ? u : '#';
    } catch (err) { return '#'; }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function findCat(id) {
    for (var i = 0; i < DATA.categories.length; i++) if (DATA.categories[i].id === id) return DATA.categories[i];
    return null;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  var ICON = {
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>',
    play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    download: '<svg class="ar" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    synth: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 10h16M4 14h10M4 18h7"/><path d="m17 15 1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="currentColor" stroke-width="1"/></svg>',
    calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    pages: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg>',
    video: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/></svg>',
    watermark: '<svg class="doc__wm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
  };

  /* 2. Render de la carpeta --------------------------------------------- */
  var detailView = $('#view-detail');
  var detailRoot = $('#detail-root');
  var homeView = $('#view-home');

  function coverHTML(doc, cat) {
    var t = esc(doc.title);
    switch (doc.cover) {
      case 'navy':
        return '<div class="cv cv--navy">' +
          '<div class="cv__band" style="height:13px;background:#1F2A44"></div>' +
          '<div style="flex:1;display:flex;min-height:0"><div class="cv__txt" style="flex:1;padding:7px;color:#1F2A44">' + t + '</div><div style="width:11px;background:var(--c-guinda)"></div></div>' +
          '<div class="cv__band" style="height:26px;background:#B8B8BC"></div>' +
          '<div class="cv__band" style="height:11px;background:#1F2A44"></div></div>';
      case 'verde':
        return '<div class="cv cv--verde">' +
          '<div class="cv__band" style="height:18px;background:var(--c-guinda)"></div>' +
          '<div style="flex:1;padding:8px;display:flex;flex-direction:column;justify-content:center;gap:4px">' +
          '<div class="cv__label" style="color:var(--c-verde);background:#fff">' + esc(doc.tag) + '</div>' +
          '<div class="cv__label" style="color:#fff;background:var(--c-verde-700)">' + esc(cat.title) + '</div></div>' +
          '<div class="cv__band" style="height:18px;background:var(--c-guinda)"></div></div>';
      case 'oro':
        return '<div class="cv cv--oro" style="color:var(--c-guinda-dark)"><span class="cv__ring" style="color:var(--c-guinda)"></span><div class="cv__txt">' + t + '</div></div>';
      default: /* guinda */
        return '<div class="cv cv--guinda" style="color:#fff"><span class="cv__ring"></span><div class="cv__txt">' + t + '</div></div>';
    }
  }

  function docHTML(doc, cat, i) {
    var meta = '<li>' + ICON.calendar + esc(doc.year) + '</li><li>' + ICON.file + 'PDF</li>' +
      (doc.pages ? '<li>' + ICON.pages + esc(doc.pages) + '</li>' : '') +
      '<li>' + ICON.video + 'Video resumen</li>';
    return '' +
      '<li class="doc" data-tone="' + esc(doc.tone) + '" data-doc="' + esc(doc.id) + '" style="--i:' + i + '">' +
        '<span class="doc__deco" aria-hidden="true">' + ICON.watermark + '</span>' +
        '<div class="doc__cover">' +
          '<div class="book" aria-hidden="true"><div class="book__page"></div>' + coverHTML(doc, cat) + '</div>' +
          '<button class="play" type="button" data-action="video" aria-label="Ver resumen en video: ' + esc(doc.title) + '">' +
            '<span class="ring" aria-hidden="true"></span>' + ICON.play.replace('width="18" height="18"', 'width="20" height="20"') +
          '</button>' +
          '<span class="tip" aria-hidden="true">Te lo explicamos en video</span>' +
        '</div>' +
        '<span class="eyebrow doc__tag">' + esc(doc.tag) + '</span>' +
        '<h3 class="ttl doc__title">' + esc(doc.title) + '</h3>' +
        '<ul class="meta doc__meta" role="list">' + meta + '</ul>' +
        '<div class="doc__actions">' +
          '<a class="btn btn--primary" href="' + esc(safeUrl(doc.pdf)) + '" data-download>' + ICON.download + 'Descargar PDF</a>' +
          '<button class="btn btn--outline" type="button" data-action="video">' + ICON.play + 'Ver video</button>' +
          '<button class="btn btn--soft" type="button" data-action="synth">' + ICON.synth + 'Síntesis</button>' +
        '</div>' +
      '</li>';
  }

  function renderDetail(cat) {
    var card = cardFor(cat.id);
    var stage = card.querySelector('.stage');
    var shapeClass = stage.className.replace('stage', '').trim();
    var sceneSVG = stage.innerHTML;          // reutiliza la misma ilustración animada
    var n = cat.docs.length;

    var tabs = DATA.categories.map(function (c) {
      return '<a class="tab" href="#/' + esc(c.id) + '"' + (c.id === cat.id ? ' aria-current="page"' : '') + '><b>' + esc(c.num) + '</b>' + esc(c.title) + '</a>';
    }).join('');

    setHTML(detailRoot, '' +
      '<section class="hero" aria-labelledby="cat-title">' +
        '<div class="hero__top">' +
          '<a class="back" href="#/">' + ICON.back + 'Volver a categorías</a>' +
          '<nav class="tabs" aria-label="Categorías">' + tabs + '</nav>' +
        '</div>' +
        '<div class="hero__grid">' +
          '<div class="hero__text">' +
            '<span class="eyebrow">Categoría ' + esc(cat.num) + '</span>' +
            '<h1 class="ttl hero__title" id="cat-title" tabindex="-1" data-vt="title"><span class="hl">' + esc(cat.title) + '</span></h1>' +
            '<p class="hero__lead">' + esc(cat.lead) + '</p>' +
          '</div>' +
          '<div class="hero__art" aria-hidden="true">' +
            '<span class="num" data-vt="num">' + esc(cat.num) + '</span>' +
            '<div class="stage stage--hero ' + shapeClass + '" data-vt="stage" style="--stage-bg:' + stage.style.getPropertyValue('--stage-bg') + '">' + sceneSVG + '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="docs" aria-labelledby="docs-title">' +
        '<header class="docs__head">' +
          '<h2 class="ttl docs__title" id="docs-title"><span class="hl">Documentos</span></h2>' +
          '<span class="docs__count">' + plural(n, 'documento', 'documentos') + ' · con video y síntesis</span>' +
        '</header>' +
        '<ul class="docs__list" role="list">' + cat.docs.map(function (d, i) { return docHTML(d, cat, i); }).join('') + '</ul>' +
      '</section>');

    observeOffscreen(detailRoot);
  }

  /* 3. Router + transición --------------------------------------------- */
  var current = null;        // id de la categoría abierta (null = inicio)
  var homeScroll = 0;
  var booted = false;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function cardFor(id) { return $('.card[data-cat="' + id + '"]'); }
  function routeFromHash() {
    var m = location.hash.match(/^#\/([\w-]+)/);
    return m && findCat(m[1]) ? m[1] : null;
  }

  // Nombres de View Transition: solo un elemento por nombre a la vez.
  function clearNames() { $$('[data-vt]').forEach(function (el) { el.style.viewTransitionName = ''; }); }
  function nameParts(scope) {
    $$('[data-vt]', scope).forEach(function (el) { el.style.viewTransitionName = 'folder-' + el.getAttribute('data-vt'); });
  }
  // Rectángulo de la tarjeta → variables para el clip-path de la animación
  function setClipFrom(el) {
    var r = el.getBoundingClientRect();
    var w = window.innerWidth, h = window.innerHeight;
    root.style.setProperty('--vt-t', r.top + 'px');
    root.style.setProperty('--vt-r', (w - r.right) + 'px');
    root.style.setProperty('--vt-b', (h - r.bottom) + 'px');
    root.style.setProperty('--vt-l', r.left + 'px');
  }

  function applyState(next, prev) {
    closeAllDialogs(true);
    clearNames();
    if (next) {
      renderDetail(findCat(next));
      homeView.hidden = true;
      detailView.hidden = false;
      window.scrollTo(0, 0);
      document.title = findCat(next).title + ' · Guías y documentos';
    } else {
      detailView.hidden = true;
      homeView.hidden = false;
      window.scrollTo(0, homeScroll);
      document.title = 'Guías y documentos';
    }
    current = next;
  }

  function afterNav(next, prev) {
    clearNames();
    root.classList.remove('vt-open', 'vt-close', 'vt-swap');
    if (next) {
      var h = $('#cat-title');
      if (h) h.focus({ preventScroll: true });
    } else if (prev) {
      var c = cardFor(prev);
      if (c) c.focus({ preventScroll: true });
    }
  }

  function go(next) {
    var prev = current;
    if (next === prev) return;
    var mode = !prev ? 'open' : !next ? 'close' : 'swap';
    if (mode === 'open') homeScroll = window.scrollY;

    // Sin soporte, movimiento reducido o primera carga: cambio directo
    if (!canVT || reduceMotion.matches || !booted) {
      applyState(next, prev);
      var v = next ? detailView : homeView;
      if (booted && !reduceMotion.matches) {
        v.classList.remove('is-entering'); void v.offsetWidth; v.classList.add('is-entering');
      }
      afterNav(next, prev);
      return;
    }

    // Estado "antes": nombrar las piezas que viajan
    if (mode === 'open') {
      var card = cardFor(next);
      nameParts(card);
      setClipFrom(card);
    } else {
      nameParts(detailRoot);
    }
    root.classList.add('vt-' + mode);

    var t = document.startViewTransition(function () {
      applyState(next, prev);
      // Estado "después"
      if (next) nameParts(detailRoot);
      else {
        var target = cardFor(prev);
        nameParts(target);
        setClipFrom(target);
      }
    });
    t.finished.then(function () { afterNav(next, prev); }, function () { afterNav(next, prev); });
  }

  window.addEventListener('hashchange', function () {
    var h = location.hash;
    // Solo rutas "#/..." o vacío; otros hashes (anclas) se ignoran
    if (h && h.indexOf('#/') !== 0) return;
    go(routeFromHash());
  });

  /* 4. Modales --------------------------------------------------------- */
  var dlgVideo = $('#dlg-video');
  var dlgSynth = $('#dlg-synth');
  var active = { cat: null, doc: null };

  function fill(dlg, doc) {
    $$('[data-field]', dlg).forEach(function (el) {
      var k = el.getAttribute('data-field');
      el.textContent = doc[k] || '';
    });
    $$('[data-field-href]', dlg).forEach(function (el) { el.setAttribute('href', safeUrl(doc[el.getAttribute('data-field-href')])); });
    var tag = $('[data-field="tag"]', dlg);
    if (tag) tag.style.setProperty('--tone', doc.tone === 'verde' ? 'var(--c-verde-700)' : 'var(--c-guinda)');
  }

  function openDialog(dlg) {
    dlg.classList.remove('is-closing');
    if (!dlg.open) dlg.showModal();
  }

  function closeDialog(dlg, instant) {
    if (!dlg.open) return;
    if (dlg === dlgVideo) setPlaying(false);
    var panel = $('.modal__panel', dlg);
    if (instant || reduceMotion.matches) { dlg.close(); return; }
    dlg.classList.add('is-closing');
    function done(e) {
      if (e && e.target !== panel) return;   // ignora animaciones internas (eq, barra…)
      panel.removeEventListener('animationend', done);
      dlg.classList.remove('is-closing');
      dlg.close();
    }
    panel.addEventListener('animationend', done);
  }
  function closeAllDialogs(instant) { closeDialog(dlgVideo, instant); closeDialog(dlgSynth, instant); }

  [dlgVideo, dlgSynth].forEach(function (dlg) {
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(dlg); });   // Esc
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) closeDialog(dlg);                                                 // clic fuera
      if (e.target.closest('[data-close]')) closeDialog(dlg);
    });
  });

  // Reproductor (placeholder): play/pausa y barra de progreso
  var player = $('.player', dlgVideo);
  var bigplay = $('[data-toggle]', dlgVideo);
  function setPlaying(on) {
    player.setAttribute('data-playing', on ? 'true' : 'false');
    bigplay.setAttribute('aria-label', on ? 'Pausar' : 'Reproducir');
    $('[data-status]', dlgVideo).textContent = on ? 'Reproduciendo' : 'En pausa';
  }
  function restartProgress() {
    var p = $('.prog', dlgVideo);
    p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
  }
  bigplay.addEventListener('click', function () { setPlaying(player.getAttribute('data-playing') !== 'true'); });

  function openVideo(doc) {
    active.doc = doc;
    fill(dlgVideo, doc);
    setPlaying(true);
    restartProgress();
    openDialog(dlgVideo);
  }
  function openSynth(doc) {
    active.doc = doc;
    fill(dlgSynth, doc);
    openDialog(dlgSynth);
  }
  $('[data-to-video]', dlgSynth).addEventListener('click', function () { closeDialog(dlgSynth, true); openVideo(active.doc); });
  $('[data-to-synth]', dlgVideo).addEventListener('click', function () { closeDialog(dlgVideo, true); openSynth(active.doc); });

  // Acciones de cada documento (delegación)
  detailRoot.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var item = btn.closest('[data-doc]');
    var cat = findCat(current);
    var doc = cat && cat.docs.filter(function (d) { return d.id === item.getAttribute('data-doc'); })[0];
    if (!doc) return;
    if (btn.getAttribute('data-action') === 'video') openVideo(doc);
    else openSynth(doc);
  });

  /* 5. Descargas (placeholder) y aviso --------------------------------- */
  // En producción, quitar este interceptor: los enlaces apuntan al PDF real.
  var toast = $('#toast');
  var toastTimer = 0;
  var hasPopover = typeof toast.showPopover === 'function';
  function showToast(msg) {
    toast.textContent = msg;
    if (hasPopover) {
      try { toast.hidePopover(); } catch (err) { /* no abierto */ }
      toast.showPopover();
    }
    toast.classList.remove('is-on'); void toast.offsetWidth; toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-on');
      if (hasPopover) setTimeout(function () { try { toast.hidePopover(); } catch (err) { /* ya cerrado */ } }, 300);
    }, 2400);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-download]');
    if (!a) return;
    e.preventDefault();
    showToast('Descargando PDF…');
  });

  /* 6. Pausa de animaciones fuera de pantalla -------------------------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle('is-off', !en.isIntersecting); });
  }, { rootMargin: '120px 0px' }) : null;

  function observeOffscreen(scope) {
    if (!io) return;
    $$('.card, .doc, .hero__art', scope).forEach(function (el) { io.observe(el); });
  }

  /* 7. Arranque -------------------------------------------------------- */
  root.classList.add('is-booting');
  setTimeout(function () { root.classList.remove('is-booting'); }, 1400);
  observeOffscreen(homeView);

  var initial = routeFromHash();
  if (initial) go(initial);
  booted = true;
})();

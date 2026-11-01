/* One-page site: views (#/analyst, #/modules, #/investors), cookie notice, back-to-top arrow. */
(function () {
  var KEY = 'ii_cookie_choice';
  function getChoice() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---- views ---- */
  var views = [].slice.call(document.querySelectorAll('.view'));
  var tabs = [].slice.call(document.querySelectorAll('[data-tab]'));
  var subnavs = [].slice.call(document.querySelectorAll('.subnav'));
  var subbar = document.querySelector('.subbar');
  var names = views.map(function (v) { return v.getAttribute('data-view'); });

  function viewOfId(id) {
    var el = document.getElementById(id);
    var v = el && el.closest ? el.closest('.view') : null;
    return v ? v.getAttribute('data-view') : null;
  }
  function parse() {
    var h = '';
    try { h = decodeURIComponent((location.hash || '').replace(/^#/, '')); } catch (e) { h = (location.hash || '').replace(/^#/, ''); }
    if (h.charAt(0) === '/') {
      var p = h.slice(1).split('/');
      return { view: names.indexOf(p[0]) > -1 ? p[0] : 'analyst', id: p[1] || '' };
    }
    if (h) { var v = viewOfId(h); if (v) { return { view: v, id: h }; } }
    return { view: 'analyst', id: '' };
  }
  function render(first) {
    var r = parse(), active = null;
    views.forEach(function (v) {
      var on = v.getAttribute('data-view') === r.view;
      v.hidden = !on;
      if (on) { active = v; }
    });
    tabs.forEach(function (t) {
      if (t.getAttribute('data-tab') === r.view) { t.setAttribute('aria-current', 'page'); }
      else { t.removeAttribute('aria-current'); }
    });
    var any = false;
    subnavs.forEach(function (s) {
      var on = s.getAttribute('data-for') === r.view;
      s.hidden = !on;
      if (on) { any = true; }
    });
    if (subbar) { subbar.hidden = !any; }
    if (active) { document.title = active.getAttribute('data-title'); }
    var el = r.id ? document.getElementById(r.id) : null;
    if (el && active && active.contains(el)) {
      setTimeout(function () { el.scrollIntoView({ behavior: first ? 'auto' : 'smooth', block: 'start' }); }, 0);
    } else if (!first) {
      window.scrollTo(0, 0);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) { return; }
    var h = a.getAttribute('href');
    if (h.length < 2) { return; }
    if (h.charAt(1) === '/') {
      if (location.hash === h) { e.preventDefault(); window.scrollTo(0, 0); }
      return;
    }
    var id = h.slice(1), v = viewOfId(id);
    if (!v) { return; }
    e.preventDefault();
    var target = '#/' + v + '/' + id;
    if (location.hash === target) { render(false); } else { location.hash = target; }
  });
  window.addEventListener('hashchange', function () { render(false); });
  if (views.length) { render(true); }

  /* ---- cookie notice ---- */
  function showBar() {
    var bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Уведомление о cookies');
    bar.innerHTML =
      '<div class="cookie-in">' +
      '<p>Сайт использует cookies и похожие технологии (память браузера). Подробнее — в <a href="cookies.html">политике cookies</a>.</p>' +
      '<div class="cookie-btns"><button type="button" class="cookie-yes">Понятно</button></div>' +
      '</div>';
    document.body.appendChild(bar);
    document.body.classList.add('has-cookie');
    bar.querySelector('.cookie-yes').addEventListener('click', function () {
      setChoice('yes');
      bar.parentNode.removeChild(bar);
      document.body.classList.remove('has-cookie');
    });
  }
  if (getChoice() !== 'yes') { showBar(); }

  /* ---- back-to-top arrow ---- */
  var up = document.createElement('button');
  up.type = 'button';
  up.className = 'to-top';
  up.setAttribute('aria-label', 'Наверх');
  up.hidden = true;
  up.innerHTML = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
  document.body.appendChild(up);
  up.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  function onScroll() { up.hidden = (window.pageYOffset || document.documentElement.scrollTop) < 500; }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

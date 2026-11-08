/* Cookie settings, Yandex Metrika after consent, back-to-top arrow, redirect of old #/ links. */
(function () {
  var KEY = 'ii_cookie_choice';
  var COUNTER_ID = 113988808;
  function getChoice() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }

  /* ---- old links like /#/modules -> real pages ---- */
  var old = /^#\/(analyst|modules|investors)(?:\/(.*))?$/.exec(location.hash || '');
  if (old) {
    location.replace((old[1] === 'analyst' ? '/' : '/' + old[1] + '/') + (old[2] ? '#' + old[2] : ''));
    return;
  }

  /* Keep contact channels here; Max is shown as a plain-text option only (not a working channel); add a link after the Max bot is verified. */
  var CONTACT_CHANNELS = [
    { label: 'Связаться быстрее', href: 'https://t.me/egorka_vin' }
  ];
  var contactTargets = document.querySelectorAll('[data-contact-channels]');
  Array.prototype.forEach.call(contactTargets, function (target) {
    CONTACT_CHANNELS.forEach(function (channel, index) {
      if (index) { target.appendChild(document.createTextNode(' · ')); }
      var link = document.createElement('a');
      link.href = channel.href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = channel.label;
      target.appendChild(link);
    });
    var maxNote = document.createElement('span');
    maxNote.textContent = ' · Max — подключим по запросу (сейчас не подключён)';
    target.appendChild(maxNote);
  });

  /* ---- Yandex Metrika: loaded only after "Принять" ---- */
  function loadMetrika() {
    if (window.__iiMetrika) { return; }
    window.__iiMetrika = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(COUNTER_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }

  /* ---- cookie notice: Метрика только после явного согласия; "Отклонить" равнозначна "Принять"; настройку можно открыть снова ---- */
  function closeBar() {
    var old = document.querySelector('.cookie-bar');
    if (old) { old.parentNode.removeChild(old); }
    document.body.classList.remove('has-cookie');
  }
  function showBar() {
    closeBar();
    var bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Настройка cookies');
    bar.innerHTML =
      '<div class="cookie-in">' +
      '<p>Для статистики посещений мы можем использовать «Яндекс Метрику» (аналитические cookies, данные получает Яндекс, РФ). Включим её только с вашего согласия. Подробнее — в <a href="/cookies.html">политике cookies</a> и <a href="/privacy/">политике обработки данных</a>.</p>' +
      '<div class="cookie-btns"><button type="button" class="cookie-no">Отклонить</button><button type="button" class="cookie-yes">Принять</button></div>' +
      '</div>';
    document.body.appendChild(bar);
    document.body.classList.add('has-cookie');
    bar.querySelector('.cookie-yes').addEventListener('click', function () {
      setChoice('yes'); closeBar(); loadMetrika();
    });
    bar.querySelector('.cookie-no').addEventListener('click', function () {
      var was = getChoice();
      setChoice('no'); closeBar();
      if (was === 'yes') { location.reload(); } // уже загруженный счётчик выгружаем перезагрузкой страницы
    });
  }
  var ch = getChoice();
  if (ch === 'yes') { loadMetrika(); } else if (ch !== 'no') { showBar(); }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); showBar(); }
  });

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

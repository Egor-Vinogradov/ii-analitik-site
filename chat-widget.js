/* Чат-виджет ii-analitik.site: кнопка справа внизу, окно чата, ответы бота по базе знаний (workflow 07 studio).
   Подключение: <script src="/chat-widget.js" defer></script> перед </body>. Без внешних библиотек.
   Бот не видит данные клиентов и не подключён к 1С. Принимает только текст.
   Шапка: «Очистить» (новый диалог), звук ответа вкл/выкл (запоминается), закрыть. */
(function () {
  if (window.__iiChat) { return; }
  window.__iiChat = true;
  // Кнопка чата появляется, только если сервер бота доступен (читаемый ответ /healthz с разрешением CORS для сайта).
  // Нет связи, туннель или n8n выключены, ответ 5xx или таймаут 6 с - виджета на странице нет.
  var HEALTH = 'https://bot.ii-analitik.site/healthz';
  if (!window.fetch) { return; }
  var ctl = window.AbortController ? new AbortController() : null;
  var tm = setTimeout(function () { if (ctl) { ctl.abort(); } }, 6000);
  fetch(HEALTH, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
    .then(function (r) { clearTimeout(tm); if (r.ok) { boot(); } })
    .catch(function () { clearTimeout(tm); });
  // Кнопки сайта с атрибутом data-open-chat открывают чат (если бот доступен), иначе открывают письмо на почту проекта; в тело письма подставляется страница, откуда пришла заявка.
  // письмо-запас: добавляем в тело путь страницы (по нему мы понимаем, откуда заявка)
  try {
    var ml = document.querySelectorAll('a[data-open-chat][href^="mailto:"]');
    for (var mi = 0; mi < ml.length; mi++) {
      var hr = ml[mi].getAttribute('href');
      if (hr.indexOf('body=') !== -1 && decodeURIComponent(hr).indexOf('Страница:') === -1) { ml[mi].setAttribute('href', hr + encodeURIComponent('\n\n— — —\nСтраница: ' + location.pathname)); }
    }
  } catch (err) {}
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-open-chat]') : null;
    if (t && window.__iiChatOpen) { e.preventDefault(); window.__iiChatOpen(); }
  });
  function boot() {
  var API = 'https://bot.ii-analitik.site/webhook/sajt-chat';
  var MAX = 1000;
  var TG = 'https://t.me/ii_analitik_1c';
  var HELLO = 'Здравствуйте! Я помощник ИИ-аналитика для 1С. Расскажу, что умеют аналитик и модули распознавания документов и банка, как подключиться. Спросите своими словами.';
  var START = ['Что умеет', 'Распознавание документов', 'Безопасность', 'Оставить заявку'];
  var MAIL = 'info@ii-analitik.site', PHONE = '+375 29 508 02 10';
  var DOWN = 'Сейчас бот недоступен или превышен лимит сообщений. Заявку можно оставить письмом на ' + MAIL + ' или по телефону ' + PHONE + '. Новости проекта — в канале ' + TG + '.';
  var KS = 'ii_chat_session', KL = 'ii_chat_log', KSND = 'ii_chat_sound';

  function get(st, k) { try { return window[st].getItem(k); } catch (e) { return null; } }
  function put(st, k, v) { try { window[st].setItem(k, v); } catch (e) {} }
  function newId() {
    var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = 'w-';
    var r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(24)) : null;
    for (var i = 0; i < 24; i++) { s += a.charAt((r ? r[i] : Math.floor(Math.random() * 256)) % a.length); }
    return s;
  }
  var session = get('localStorage', KS);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(session || '')) { session = newId(); put('localStorage', KS, session); }
  var log = [];
  try { log = JSON.parse(get('sessionStorage', KL) || '[]') || []; } catch (e) { log = []; }

  var css = [
    '.iiw-btn{position:fixed;right:20px;bottom:24px;z-index:45;height:52px;padding:0 20px 0 16px;border-radius:999px;border:0;cursor:pointer;',
    'background:#E8A33D;color:#14213D;font:600 15px/1 "IBM Plex Sans","Segoe UI",Arial,sans-serif;display:inline-flex;align-items:center;gap:8px;',
    'box-shadow:0 8px 24px rgba(20,33,61,.3)}',
    '.iiw-btn:hover{background:#F0B556}.iiw-btn:focus-visible,.iiw-x:focus-visible,.iiw-chip:focus-visible,.iiw-send:focus-visible,.iiw-clr:focus-visible{outline:3px solid #14213D;outline-offset:2px}',
    '.iiw-box{position:fixed;right:20px;bottom:24px;z-index:60;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 48px);',
    'display:none;flex-direction:column;background:#FDFCF9;color:#14213D;border:1px solid #DCDAD2;border-radius:16px;overflow:hidden;',
    'box-shadow:0 18px 50px rgba(20,33,61,.35);font:15px/1.45 "IBM Plex Sans","Segoe UI",Arial,sans-serif}',
    '.iiw-box.open{display:flex}.iiw-open .iiw-btn{display:none}',
    '.iiw-head{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 16px;background:#14213D;color:#F6F5F0;border-bottom:3px solid #E8A33D}',
    '.iiw-head b{flex:1;font:600 16px/1.2 "Rubik","Trebuchet MS",Arial,sans-serif}.iiw-head small{display:block;font:400 12px/1.3 inherit;color:#C9D3E3}',
    '.iiw-x{width:36px;height:36px;border-radius:50%;border:1px solid #5B6B8C;background:transparent;color:#F6F5F0;font-size:20px;line-height:1;cursor:pointer}',
    '.iiw-clr{flex:none;height:32px;padding:0 10px;border-radius:999px;border:1px solid #5B6B8C;background:transparent;color:#F6F5F0;font:13px/1 inherit;cursor:pointer}',
    '.iiw-clr:hover,.iiw-x:hover{background:#22345C}.iiw-clr.warn{background:#E8A33D;border-color:#E8A33D;color:#14213D}',
    '.iiw-snd{font-size:16px}',
    '.iiw-log{flex:1 1 auto;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#F6F5F0}',
    '.iiw-m{max-width:86%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}',
    '.iiw-bot{align-self:flex-start;background:#FDFCF9;border:1px solid #DCDAD2;border-bottom-left-radius:4px}',
    '.iiw-me{align-self:flex-end;background:#14213D;color:#F6F5F0;border-bottom-right-radius:4px}',
    '.iiw-m a{color:#8A520C;text-decoration:underline}.iiw-me a{color:#E8A33D}',
    '.iiw-dots{align-self:flex-start;color:#4A5568;font-size:13px;padding:2px 4px}',
    '.iiw-chips{flex:none;max-height:38%;overflow-y:auto;display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#F6F5F0}',
    '.iiw-chip{font:inherit;font-size:14px;padding:6px 12px;border-radius:999px;border:1px solid #14213D;background:#FDFCF9;color:#14213D;cursor:pointer}',
    '.iiw-chip:hover{background:#E9EEF5}',
    '.iiw-form{display:flex;gap:8px;padding:10px;border-top:1px solid #DCDAD2;background:#FDFCF9}',
    '.iiw-in{flex:1;min-width:0;resize:none;height:44px;max-height:120px;padding:10px 12px;border:1px solid #DCDAD2;border-radius:12px;',
    'font:16px/1.4 "IBM Plex Sans","Segoe UI",Arial,sans-serif;color:#14213D;background:#fff}',
    '.iiw-in:focus{outline:2px solid #E8A33D;border-color:#E8A33D}',
    '.iiw-send{flex:none;height:44px;padding:0 16px;border:0;border-radius:12px;background:#14213D;color:#F6F5F0;font:600 15px/1 inherit;cursor:pointer}',
    '.iiw-send:disabled{opacity:.5;cursor:default}',
    '.iiw-note{padding:0 12px 8px;font-size:11px;color:#4A5568;background:#FDFCF9}',
    '@media (max-width:480px){.iiw-box{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0;border:0}',
    '.iiw-btn{right:16px}}'
  ].join('');

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text != null) { e.textContent = text; } return e; }
  // текст → узлы; ссылки https://… кликабельны, всё остальное — только текст (никакого HTML от сервера)
  function fill(node, text) {
    var re = /(https:\/\/[^\s<>"')]+)/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) { node.appendChild(document.createTextNode(text.slice(last, m.index))); }
      var url = m[1].replace(/[.,;:!?]+$/, '');
      var a = el('a', null, url); a.href = url; a.target = '_blank'; a.rel = 'noopener nofollow';
      node.appendChild(a);
      last = m.index + url.length; re.lastIndex = last;
    }
    if (last < text.length) { node.appendChild(document.createTextNode(text.slice(last))); }
  }

  var st = el('style'); st.textContent = css; document.head.appendChild(st);
  var btn = el('button', 'iiw-btn'); btn.type = 'button'; btn.setAttribute('aria-label', 'Открыть чат с помощником');
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';
  btn.appendChild(el('span', null, 'Спросить'));
  var box = el('div', 'iiw-box'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Чат с помощником');
  var head = el('div', 'iiw-head'); var ttl = el('b', null, 'Помощник ИИ-аналитика');
  ttl.appendChild(el('small', null, 'Отвечает по описанию продукта, к 1С не подключён'));
  var x = el('button', 'iiw-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Закрыть чат');
  var clr = el('button', 'iiw-clr', 'Очистить'); clr.type = 'button'; clr.setAttribute('aria-label', 'Очистить чат и начать новый диалог');
  var snd = el('button', 'iiw-x iiw-snd'); snd.type = 'button';
  head.appendChild(ttl); head.appendChild(clr); head.appendChild(snd); head.appendChild(x);
  var list = el('div', 'iiw-log'); list.setAttribute('aria-live', 'polite');
  var chips = el('div', 'iiw-chips');
  var form = el('form', 'iiw-form');
  var input = el('textarea', 'iiw-in'); input.rows = 1; input.maxLength = MAX; input.placeholder = 'Ваш вопрос…'; input.setAttribute('aria-label', 'Ваш вопрос');
  var send = el('button', 'iiw-send', 'Отправить'); send.type = 'submit';
  form.appendChild(input); form.appendChild(send);
  var note = el('div', 'iiw-note', 'Не присылайте пароли и выгрузки из 1С. Только текст, до 1 000 знаков. Контакты в чате не оставляйте: заявка — на странице «Оставить заявку». Как обрабатываются сообщения — в ');
  var pl = el('a', null, 'политике обработки данных'); pl.href = '/privacy/'; pl.target = '_blank'; pl.rel = 'noopener'; pl.style.color = 'inherit'; note.appendChild(pl); note.appendChild(document.createTextNode('.'));
  box.appendChild(head); box.appendChild(list); box.appendChild(chips); box.appendChild(form); box.appendChild(note);
  document.body.appendChild(btn); document.body.appendChild(box);

  // кнопка всегда над плашкой cookies (её высота на телефоне ~160 px), стрелка «наверх» сайта — над кнопкой
  function place() {
    var c = document.querySelector('.cookie-bar');
    var h = c ? Math.ceil(c.getBoundingClientRect().height) : 0;
    var base = window.innerWidth <= 480 ? 16 : 24;
    var b = h ? h + 12 : base;
    btn.style.bottom = b + 'px';
    var t = document.querySelector('.to-top');
    if (t) { t.style.bottom = (b + 64) + 'px'; }
  }
  place();
  window.addEventListener('resize', place);
  if (window.MutationObserver) { new MutationObserver(place).observe(document.body, { childList: true, attributes: true, attributeFilter: ['class'] }); }

  function save() { put('sessionStorage', KL, JSON.stringify(log.slice(-40))); }
  // прокрутка в конец; повтор после перерисовки, потому что строка кнопок меняет высоту списка
  function toBottom() { list.scrollTop = list.scrollHeight; if (window.requestAnimationFrame) { requestAnimationFrame(function () { list.scrollTop = list.scrollHeight; }); } }
  function add(who, text, keep) {
    var m = el('div', 'iiw-m ' + (who === 'me' ? 'iiw-me' : 'iiw-bot')); fill(m, text);
    list.appendChild(m); toBottom();
    if (keep !== false) { log.push({ w: who, t: text }); save(); }
  }
  function setChips(arr) {
    chips.textContent = '';
    (arr || []).forEach(function (t) {
      var c = el('button', 'iiw-chip', t); c.type = 'button';
      c.addEventListener('click', function () { ask(t); });
      chips.appendChild(c);
    });
    toBottom();
  }
  // звук ответа: короткий сигнал через Web Audio (без файлов). Включается жестом пользователя (отправка вопроса), выключатель запоминается.
  var sound = get('localStorage', KSND) !== '0', ac = null;
  function sndView() {
    snd.textContent = sound ? '\uD83D\uDD14' : '\uD83D\uDD15';
    snd.setAttribute('aria-label', sound ? 'Звук ответов включён, выключить' : 'Звук ответов выключен, включить');
    snd.title = sound ? 'Звук включён' : 'Звук выключен';
  }
  function unlock() {
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) { return; }
      if (!ac) { ac = new C(); }
      if (ac.state === 'suspended') { ac.resume(); }
    } catch (e) {}
  }
  function ding() {
    if (!sound || !ac || !box.classList.contains('open')) { return; }
    try {
      var t0 = ac.currentTime;
      [[880, 0], [1175, 0.12]].forEach(function (p) {
        var o = ac.createOscillator(), g = ac.createGain(), t = t0 + p[1];
        o.type = 'sine'; o.frequency.value = p[0];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.25);
      });
    } catch (e) {}
  }
  sndView();
  snd.addEventListener('click', function () {
    sound = !sound; put('localStorage', KSND, sound ? '1' : '0'); sndView();
    if (sound) { unlock(); ding(); }
  });
  var busy = false, epoch = 0;
  function ask(text) {
    text = String(text || '').trim();
    if (!text || busy) { return; }
    if (text === 'Оставить заявку') { location.href = '/zayavka/'; return; }
    if (text.length > MAX) { add('bot', 'Сообщение длиннее 1 000 знаков — сократите, пожалуйста.', false); return; }
    unlock();
    var ep = epoch;
    busy = true; send.disabled = true; setChips([]);
    add('me', text); input.value = ''; input.style.height = '';
    var dots = el('div', 'iiw-dots', 'Печатает…'); list.appendChild(dots); list.scrollTop = list.scrollHeight;
    var done = false;
    function finish(reply, buttons, ok) {
      if (done) { return; } done = true;
      if (ep !== epoch) { return; } // чат очищен, пока шёл запрос: поздний ответ не показываем
      if (dots.parentNode) { dots.parentNode.removeChild(dots); }
      add('bot', reply); setChips(buttons); busy = false; send.disabled = false; input.focus();
      if (ok) { ding(); }
    }
    var timer = setTimeout(function () { finish(DOWN, []); }, 60000);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', API, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      clearTimeout(timer);
      var r = null; try { r = JSON.parse(xhr.responseText); } catch (e) { r = null; }
      if (xhr.status === 200 && r && typeof r.reply === 'string' && r.reply) {
        var b = Array.isArray(r.buttons) ? r.buttons.filter(function (v) { return typeof v === 'string'; }).slice(0, 6) : [];
        finish(r.reply.slice(0, 3000), b, true);
      } else { finish(DOWN, []); }
    };
    xhr.onerror = function () { clearTimeout(timer); finish(DOWN, []); };
    xhr.send(JSON.stringify({ session: session, text: text }));
  }
  // «Очистить»: двойное нажатие (первое просит подтверждения 4 с). Новый диалог = новый идентификатор сессии, шаги заявки начинаются заново.
  var armed = null;
  function disarm() { if (armed) { clearTimeout(armed); armed = null; } clr.classList.remove('warn'); clr.textContent = 'Очистить'; }
  clr.addEventListener('click', function () {
    if (!armed) {
      clr.classList.add('warn'); clr.textContent = 'Точно очистить?';
      armed = setTimeout(disarm, 4000);
      return;
    }
    disarm();
    epoch++; busy = false; send.disabled = false;
    log = []; save(); list.textContent = '';
    session = newId(); put('localStorage', KS, session);
    add('bot', HELLO, false); setChips(START);
    input.value = ''; input.style.height = ''; input.focus();
  });
  function open() {
    box.classList.add('open'); document.documentElement.classList.add('iiw-open');
    if (!list.firstChild) {
      if (log.length) { log.forEach(function (m) { add(m.w, m.t, false); }); setChips(START.slice(0, 3).concat('Оставить заявку')); }
      else { add('bot', HELLO, false); setChips(START); }
    }
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() { box.classList.remove('open'); document.documentElement.classList.remove('iiw-open'); btn.focus(); }
  btn.addEventListener('click', open);
  window.__iiChatOpen = function () { open(); };
  x.addEventListener('click', close);
  box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  input.addEventListener('input', function () { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; toBottom(); });
  input.addEventListener('focus', function () { setTimeout(toBottom, 300); });
  window.addEventListener('resize', toBottom);
  // файлы не принимаем: перетаскивание и вставка картинок — подсказка
  box.addEventListener('dragover', function (e) { e.preventDefault(); });
  box.addEventListener('drop', function (e) { e.preventDefault(); add('bot', 'Я понимаю только текст. Файлы и документы не принимаю.', false); });
  input.addEventListener('paste', function (e) {
    var f = e.clipboardData && e.clipboardData.files;
    if (f && f.length) { e.preventDefault(); add('bot', 'Я понимаю только текст. Файлы и документы не принимаю.', false); }
  });
  }
})();

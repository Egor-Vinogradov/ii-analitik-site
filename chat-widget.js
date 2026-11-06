/* Чат-виджет ii-analitik.site: кнопка справа внизу, окно чата, ответы бота по базе знаний (workflow 07 studio).
   Подключение: <script src="/chat-widget.js" defer></script> перед </body>. Без внешних библиотек.
   Бот не видит данные клиентов и не подключён к 1С. Принимает только текст. */
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
  function boot() {
  var API = 'https://bot.ii-analitik.site/webhook/sajt-chat';
  var MAX = 1000;
  var TG = 'https://t.me/egorka_vin';
  var HELLO = 'Здравствуйте! Я помощник ИИ-аналитика для 1С. Расскажу, что умеют аналитик и модули распознавания документов и банка, как подключиться. Спросите своими словами.';
  var START = ['Что умеет', 'Распознавание документов', 'Безопасность', 'Оставить заявку'];
  var DOWN = 'Сейчас бот недоступен, оставьте контакт: Telegram ' + TG + ', телефон +375 29 508-02-10 или почта egor.vin12345@gmail.com. Мы ответим в рабочее время.';
  var KS = 'ii_chat_session', KL = 'ii_chat_log';

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
    '.iiw-btn:hover{background:#F0B556}.iiw-btn:focus-visible,.iiw-x:focus-visible,.iiw-chip:focus-visible,.iiw-send:focus-visible{outline:3px solid #14213D;outline-offset:2px}',
    '.iiw-box{position:fixed;right:20px;bottom:24px;z-index:60;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 48px);',
    'display:none;flex-direction:column;background:#FDFCF9;color:#14213D;border:1px solid #DCDAD2;border-radius:16px;overflow:hidden;',
    'box-shadow:0 18px 50px rgba(20,33,61,.35);font:15px/1.45 "IBM Plex Sans","Segoe UI",Arial,sans-serif}',
    '.iiw-box.open{display:flex}.iiw-open .iiw-btn{display:none}',
    '.iiw-head{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 16px;background:#14213D;color:#F6F5F0;border-bottom:3px solid #E8A33D}',
    '.iiw-head b{flex:1;font:600 16px/1.2 "Rubik","Trebuchet MS",Arial,sans-serif}.iiw-head small{display:block;font:400 12px/1.3 inherit;color:#C9D3E3}',
    '.iiw-x{width:36px;height:36px;border-radius:50%;border:1px solid #5B6B8C;background:transparent;color:#F6F5F0;font-size:20px;line-height:1;cursor:pointer}',
    '.iiw-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#F6F5F0}',
    '.iiw-m{max-width:86%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}',
    '.iiw-bot{align-self:flex-start;background:#FDFCF9;border:1px solid #DCDAD2;border-bottom-left-radius:4px}',
    '.iiw-me{align-self:flex-end;background:#14213D;color:#F6F5F0;border-bottom-right-radius:4px}',
    '.iiw-m a{color:#8A520C;text-decoration:underline}.iiw-me a{color:#E8A33D}',
    '.iiw-dots{align-self:flex-start;color:#4A5568;font-size:13px;padding:2px 4px}',
    '.iiw-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#F6F5F0}',
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
  head.appendChild(ttl); head.appendChild(x);
  var list = el('div', 'iiw-log'); list.setAttribute('aria-live', 'polite');
  var chips = el('div', 'iiw-chips');
  var form = el('form', 'iiw-form');
  var input = el('textarea', 'iiw-in'); input.rows = 1; input.maxLength = MAX; input.placeholder = 'Ваш вопрос…'; input.setAttribute('aria-label', 'Ваш вопрос');
  var send = el('button', 'iiw-send', 'Отправить'); send.type = 'submit';
  form.appendChild(input); form.appendChild(send);
  var note = el('div', 'iiw-note', 'Не присылайте пароли, выгрузки 1С и данные фирмы. Только текст, до 1 000 знаков.');
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
  function add(who, text, keep) {
    var m = el('div', 'iiw-m ' + (who === 'me' ? 'iiw-me' : 'iiw-bot')); fill(m, text);
    list.appendChild(m); list.scrollTop = list.scrollHeight;
    if (keep !== false) { log.push({ w: who, t: text }); save(); }
  }
  function setChips(arr) {
    chips.textContent = '';
    (arr || []).forEach(function (t) {
      var c = el('button', 'iiw-chip', t); c.type = 'button';
      c.addEventListener('click', function () { ask(t); });
      chips.appendChild(c);
    });
  }
  var busy = false;
  function ask(text) {
    text = String(text || '').trim();
    if (!text || busy) { return; }
    if (text.length > MAX) { add('bot', 'Сообщение длиннее 1 000 знаков — сократите, пожалуйста.', false); return; }
    busy = true; send.disabled = true; setChips([]);
    add('me', text); input.value = ''; input.style.height = '';
    var dots = el('div', 'iiw-dots', 'Печатает…'); list.appendChild(dots); list.scrollTop = list.scrollHeight;
    var done = false;
    function finish(reply, buttons) {
      if (done) { return; } done = true;
      if (dots.parentNode) { dots.parentNode.removeChild(dots); }
      add('bot', reply); setChips(buttons); busy = false; send.disabled = false; input.focus();
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
        finish(r.reply.slice(0, 3000), b);
      } else { finish(DOWN, []); }
    };
    xhr.onerror = function () { clearTimeout(timer); finish(DOWN, []); };
    xhr.send(JSON.stringify({ session: session, text: text }));
  }
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
  x.addEventListener('click', close);
  box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  input.addEventListener('input', function () { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
  // файлы не принимаем: перетаскивание и вставка картинок — подсказка
  box.addEventListener('dragover', function (e) { e.preventDefault(); });
  box.addEventListener('drop', function (e) { e.preventDefault(); add('bot', 'Я понимаю только текст. Файлы и документы не принимаю.', false); });
  input.addEventListener('paste', function (e) {
    var f = e.clipboardData && e.clipboardData.files;
    if (f && f.length) { e.preventDefault(); add('bot', 'Я понимаю только текст. Файлы и документы не принимаю.', false); }
  });
  }
})();

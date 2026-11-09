/* Форма заявки. Всё, что нужно подключить, — две переменные ниже. Пока ENDPOINT пустой, форма ничего не отправляет. */
(function () {
  'use strict';

  /* === ПАРАМЕТРЫ ПОДКЛЮЧЕНИЯ ===================================== */
  var ENDPOINT = '/zayavka/send.php';  // приём заявок на хостинге: письмо на info@ii-analitik.site
  var CALENDAR_URL = '';  // ссылка на календарь записи на демо; пусто — блок «Запись на демо» скрыт
  /* ================================================================ */

  var POLICY_VERSION = '2026-11-07'; // версия текста политики и информационного блока; менять при каждой правке
  var form = document.getElementById('lead-form');
  if (!form) { return; }
  var status = document.getElementById('lead-status');
  var send = document.getElementById('lead-send');
  var t0 = Date.now();

  if (CALENDAR_URL) {
    var box = document.getElementById('cal-box');
    var link = document.getElementById('cal-link');
    if (box && link) { link.href = CALENDAR_URL; box.hidden = false; }
  }

  function say(text, bad) {
    status.textContent = text;
    status.className = 'form-status' + (bad ? ' bad' : ' ok');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    if (f.website && f.website.value) { say('Спасибо, заявка получена.'); form.reset(); return; } // ловушка для ботов: тихо «успех», ничего не шлём
    var name = f.name.value.trim();
    var contact = f.contact.value.trim();
    if (!name || !contact) { say('Укажите имя и контакт для связи.', true); return; }
    if (!f.consent.checked) { say('Без отметки согласия заявку отправить нельзя. Можно написать на info@ii-analitik.site.', true); return; }
    if (!ENDPOINT) { say('Приём заявок через форму ещё не подключён. Напишите нам на info@ii-analitik.site.', true); return; }

    var payload = {
      name: name,
      company: f.company.value.trim(),
      contact: contact,
      interest: f.interest.value,
      message: f.message.value.trim(),
      consent: true,
      policy_version: POLICY_VERSION,
      page: location.pathname,
      referrer: document.referrer || '',
      query: location.search || '',
      elapsed_ms: Date.now() - t0,
      sent_at: new Date().toISOString()
    };

    send.disabled = true;
    say('Отправляем…');
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) { ctl.abort(); } }, 15000);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) { throw new Error('http ' + r.status); }
      say('Спасибо, заявка получена. Свяжемся в рабочее время.');
      form.reset();
      t0 = Date.now();
    }).catch(function () {
      clearTimeout(timer);
      say('Не удалось отправить заявку. Напишите нам на info@ii-analitik.site.', true);
    }).then(function () { send.disabled = false; });
  });
})();

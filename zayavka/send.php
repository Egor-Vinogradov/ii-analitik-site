<?php
// Приём заявки с формы /zayavka/ : проверка и письмо на info@ii-analitik.site. Ничего на сервере не хранится.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function done($code, $ok) { http_response_code($code); echo json_encode(array('ok' => $ok)); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { done(405, false); }
$origin = isset($_SERVER['HTTP_ORIGIN']) ? parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) : '';
if ($origin && !in_array($origin, array('ii-analitik.site', 'www.ii-analitik.site'), true)) { done(403, false); }

$raw = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($raw, true);
if (!is_array($d)) { done(400, false); }

function clean($v, $max) {
    $v = is_string($v) ? trim($v) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $v);
    return mb_substr($v, 0, $max);
}
$name = clean(isset($d['name']) ? $d['name'] : '', 120);
$contact = clean(isset($d['contact']) ? $d['contact'] : '', 120);
$company = clean(isset($d['company']) ? $d['company'] : '', 160);
$interest = clean(isset($d['interest']) ? $d['interest'] : '', 60);
$message = clean(isset($d['message']) ? $d['message'] : '', 1000);
$page = clean(isset($d['page']) ? $d['page'] : '', 200);
$policy = clean(isset($d['policy_version']) ? $d['policy_version'] : '', 20);
if ($name === '' || $contact === '' || empty($d['consent'])) { done(400, false); }
if (isset($d['elapsed_ms']) && (int)$d['elapsed_ms'] < 1500) { done(200, true); } // слишком быстро — бот, тихо «успех»

// не чаще одной заявки в 30 секунд с одного адреса
$ipKey = sys_get_temp_dir() . '/lead_' . md5(isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
if (is_file($ipKey) && time() - filemtime($ipKey) < 30) { done(429, false); }
@touch($ipKey);

$to = 'info@ii-analitik.site';
$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта ii-analitik.site') . '?=';
$body = "Новая заявка с сайта\n\n"
    . "Имя: $name\nКомпания: $company\nTelegram или телефон: $contact\nИнтересует: $interest\n\n"
    . "Задача:\n$message\n\n"
    . "Согласие на обработку данных: да (версия политики $policy)\nСтраница: $page\nВремя: " . date('d.m.Y H:i:s') . " (UTC+3)\n";
$headers = "From: ИИ-аналитик <info@ii-analitik.site>\r\nContent-Type: text/plain; charset=UTF-8\r\nMIME-Version: 1.0\r\n";
$ok = @mail($to, $subject, $body, $headers, '-finfo@ii-analitik.site');
done($ok ? 200 : 500, $ok);

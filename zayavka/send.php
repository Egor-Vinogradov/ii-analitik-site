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
$requestId = date('Ymd-His') . '-' . substr(hash('sha256', uniqid('', true)), 0, 8);
$body = "Новая заявка с сайта\n\n"
    . "Номер заявки: $requestId\nИмя: $name\nКомпания: $company\nКонтакт для связи: $contact\nИнтересует: $interest\n\n"
    . "Задача:\n$message\n\n"
    . "Согласие на обработку данных: да (версия политики $policy)\nСтраница: $page\nВремя: " . date('d.m.Y H:i:s') . " (UTC+3)\n";
$headers = "From: ИИ-аналитик <info@ii-analitik.site>\r\nContent-Type: text/plain; charset=UTF-8\r\nMIME-Version: 1.0\r\n";
$ok = mail($to, $subject, $body, $headers, '-finfo@ii-analitik.site');
if (!$ok) { error_log('Site lead email delivery failed.'); }

// Webhook-уведомление Егору в Telegram (best-effort, без персональных данных; не влияет на ответ пользователю)
if ($ok) {
    $confFile = dirname(dirname($_SERVER['DOCUMENT_ROOT'])) . '/form-notify.conf';
    if (is_file($confFile)) {
        $conf = parse_ini_file($confFile, false, INI_SCANNER_RAW);
        $webhookUrl = is_array($conf) && isset($conf['webhook_url']) ? trim($conf['webhook_url']) : '';
        $secret = is_array($conf) && isset($conf['secret']) ? trim($conf['secret']) : '';
        $urlParts = $webhookUrl !== '' ? parse_url($webhookUrl) : false;
        $validUrl = is_array($urlParts)
            && isset($urlParts['scheme'], $urlParts['host'], $urlParts['path'])
            && strtolower($urlParts['scheme']) === 'https'
            && strtolower($urlParts['host']) === 'hook.ii-analitik.site'
            && preg_match('~^/webhook/[A-Za-z0-9_-]{20,64}$~D', $urlParts['path'])
            && !isset($urlParts['user'])
            && !isset($urlParts['pass'])
            && !isset($urlParts['query'])
            && !isset($urlParts['fragment']);
        if ($validUrl && preg_match('/^[A-Za-z0-9_-]{32,100}$/D', $secret)) {
            if (!function_exists('curl_init')) {
                error_log('Site lead webhook skipped: PHP cURL extension is unavailable.');
            } else {
            $notify = json_encode(array(
                'request_id' => $requestId,
                'interest' => $interest,
                'time' => date('Y-m-d H:i:s'),
            ));
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $webhookUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $notify);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json',
                'X-Form-Secret: ' . $secret,
            ));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            $response = curl_exec($ch);
            $curlErrorCode = curl_errno($ch);
            $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($response === false || $httpCode < 200 || $httpCode >= 300) {
                error_log('Site lead webhook notification failed; HTTP ' . $httpCode . '; cURL code ' . $curlErrorCode);
            }
            }
        } elseif ($webhookUrl !== '' || $secret !== '') {
            error_log('Site lead webhook configuration is invalid; notification skipped.');
        }
    }
}

done($ok ? 200 : 500, $ok);

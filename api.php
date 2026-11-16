<?php
/*
 * Sea Transport – shared data API.
 * Upload this file with the website to any PHP 7.4+ host. Data is saved in ./data as JSON files.
 * The website detects this file automatically and switches to "Online database" mode.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$DIR = __DIR__ . '/data';
if (!is_dir($DIR) && !mkdir($DIR, 0755, true)) fail('Cannot create data folder', 500);
if (!file_exists("$DIR/.htaccess")) {
    file_put_contents("$DIR/.htaccess", "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
}
if (!file_exists("$DIR/index.html")) file_put_contents("$DIR/index.html", '');

function fail($msg, $code = 400) { http_response_code($code); echo json_encode(['ok' => false, 'error' => $msg]); exit; }
function ok($data = []) { echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE); exit; }

function read_json($file, $default) {
    if (!file_exists($file)) return $default;
    $v = json_decode(file_get_contents($file), true);
    return $v === null ? $default : $v;
}
function write_json($file, $data) {
    $tmp = $file . '.tmp';
    if (file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) === false) fail('Could not save data', 500);
    rename($tmp, $file);
}

/* Lock the trips file during read-modify-write so two submissions can't overwrite each other. */
function with_trips($fn) {
    global $DIR;
    $lock = fopen("$DIR/trips.lock", 'c');
    flock($lock, LOCK_EX);
    $trips = read_json("$DIR/trips.json", []);
    $result = $fn($trips);
    write_json("$DIR/trips.json", $trips);
    flock($lock, LOCK_UN);
    fclose($lock);
    return $result;
}

function pin_hash() {
    global $DIR;
    $h = read_json("$DIR/pin.json", null);
    return $h ? $h['hash'] : password_hash('1197', PASSWORD_DEFAULT);
}
function given_pin($body) {
    return $_SERVER['HTTP_X_ADMIN_PIN'] ?? ($body['pin'] ?? '');
}
function require_admin($body) {
    if (!password_verify((string) given_pin($body), pin_hash())) fail('Admin PIN required or incorrect', 403);
}

/* ---- Staff accounts & sessions ---- */
const STAFF_SESSION_DAYS = 30;
function staff_accounts() { global $DIR; return read_json("$DIR/staff_accounts.json", []); }   // name => password hash
function sessions() {
    global $DIR;
    $all = read_json("$DIR/sessions.json", []);
    return array_filter($all, function ($x) { return ($x['exp'] ?? 0) > time(); });
}
function save_sessions($s) { global $DIR; write_json("$DIR/sessions.json", $s); }
function current_staff() {
    $tok = $_SERVER['HTTP_X_STAFF_TOKEN'] ?? '';
    if ($tok === '') return null;
    $s = sessions()[hash('sha256', $tok)] ?? null;
    if (!$s) return null;
    // the account must still exist (admin may have removed it)
    return isset(staff_accounts()[$s['name']]) ? $s['name'] : null;
}
function is_admin($body) { return password_verify((string) given_pin($body), pin_hash()); }

function s($v, $n = 200) { return mb_substr(trim((string) ($v ?? '')), 0, $n); }
function n($v) { return ($v === '' || $v === null || !is_numeric($v)) ? '' : $v + 0; }
function clean_trip($t) {
    $staff = is_array($t['staff'] ?? null) ? $t['staff'] : [];
    return [
        'id' => s($t['id'] ?? '', 40), 'no' => (int) ($t['no'] ?? 0),
        'date' => s($t['date'] ?? '', 10), 'boat' => s($t['boat'] ?? ''), 'department' => s($t['department'] ?? ''),
        'start' => s($t['start'] ?? '', 5), 'end' => s($t['end'] ?? '', 5), 'hours' => n($t['hours'] ?? ''),
        'details' => s($t['details'] ?? '', 2000),
        'staff' => array_values(array_filter(array_map(function ($x) { return s($x, 100); }, array_slice($staff, 0, 100)))),
        'fuelTopUp' => n($t['fuelTopUp'] ?? ''), 'fuelUsed' => n($t['fuelUsed'] ?? ''),
        'submittedBy' => s($t['submittedBy'] ?? '', 100),
        'createdAt' => s($t['createdAt'] ?? '', 40), 'updatedAt' => s($t['updatedAt'] ?? '', 40),
    ];
}

$action = $_GET['action'] ?? '';
$body = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 20 * 1024 * 1024) fail('Request too large', 413);
    $body = json_decode($raw, true) ?: [];
}

switch ($action) {
    case 'ping':
        ok(['mode' => 'server']);

    case 'settings':
        ok(['settings' => read_json("$DIR/settings.json", null)]);

    case 'settings_save':
        require_admin($body);
        if (!is_array($body['settings'] ?? null)) fail('Invalid settings');
        write_json("$DIR/settings.json", $body['settings']);
        ok();

    case 'trips':
        ok(['trips' => read_json("$DIR/trips.json", [])]);

    case 'trip_save':
        $t = clean_trip($body['trip'] ?? []);
        if (!$t['date'] || !$t['boat'] || !$t['department'] || !$t['start'] || !$t['end'] || !$t['staff']) fail('Missing required fields');
        $staffName = current_staff();
        $admin = is_admin($body);
        if (!$staffName && !$admin) fail('Please log in to add a trip', 401);
        $now = gmdate('c');
        $saved = with_trips(function (&$trips) use ($t, $now, $body, $staffName) {
            foreach ($trips as $i => $x) {
                if ($t['id'] !== '' && $x['id'] === $t['id']) {
                    require_admin($body); // editing an existing trip
                    $t['no'] = $x['no']; $t['createdAt'] = $x['createdAt']; $t['updatedAt'] = $now;
                    $t['submittedBy'] = $x['submittedBy'] ?? '';
                    $trips[$i] = $t;
                    return $t;
                }
            }
            $t['submittedBy'] = $staffName ?: 'Admin';
            $t['id'] = bin2hex(random_bytes(8));
            $t['no'] = array_reduce($trips, function ($m, $x) { return max($m, (int) $x['no']); }, 0) + 1;
            $t['createdAt'] = $t['updatedAt'] = $now;
            $trips[] = $t;
            return $t;
        });
        ok(['trip' => $saved]);

    case 'trip_delete':
        require_admin($body);
        $id = s($body['id'] ?? '', 40);
        with_trips(function (&$trips) use ($id) {
            $trips = array_values(array_filter($trips, function ($x) use ($id) { return $x['id'] !== $id; }));
        });
        ok();

    case 'trips_clear':
        require_admin($body);
        with_trips(function (&$trips) { $trips = []; });
        ok();

    case 'import':
        require_admin($body);
        if (is_array($body['settings'] ?? null)) write_json("$DIR/settings.json", $body['settings']);
        $list = array_map('clean_trip', is_array($body['trips'] ?? null) ? $body['trips'] : []);
        with_trips(function (&$trips) use ($list) { $trips = $list; });
        ok();

    case 'auth':
        usleep(300000); // slow down guessing
        if (!password_verify((string) ($body['pin'] ?? ''), pin_hash())) fail('Incorrect PIN', 403);
        ok();

    case 'pin_change':
        require_admin($body);
        $new = (string) ($body['newPin'] ?? '');
        if (strlen($new) < 4) fail('PIN must be at least 4 characters');
        write_json("$DIR/pin.json", ['hash' => password_hash($new, PASSWORD_DEFAULT)]);
        ok();

    case 'staff_login':
        usleep(300000); // slow down guessing
        $name = s($body['name'] ?? '', 100);
        $acc = staff_accounts();
        if (!isset($acc[$name]) || !password_verify((string) ($body['pin'] ?? ''), $acc[$name])) fail('Incorrect name or PIN', 403);
        $token = bin2hex(random_bytes(24));
        $exp = time() + STAFF_SESSION_DAYS * 86400;
        $all = sessions();
        $all[hash('sha256', $token)] = ['name' => $name, 'exp' => $exp];
        save_sessions($all);
        ok(['name' => $name, 'token' => $token, 'exp' => $exp]);

    case 'staff_logout':
        $tok = $_SERVER['HTTP_X_STAFF_TOKEN'] ?? '';
        if ($tok !== '') { $all = sessions(); unset($all[hash('sha256', $tok)]); save_sessions($all); }
        ok();

    case 'staff_accounts':
        require_admin($body);
        ok(['names' => array_keys(staff_accounts())]);

    case 'staff_account_set':
        require_admin($body);
        $names = array_filter(array_map(function ($x) { return s($x, 100); }, is_array($body['names'] ?? null) ? $body['names'] : []));
        $new = (string) ($body['newPin'] ?? '');
        if (!$names) fail('No staff selected');
        if ($new !== '' && strlen($new) < 4) fail('PIN must be at least 4 characters');
        $acc = staff_accounts();
        foreach ($names as $n) { if ($new === '') unset($acc[$n]); else $acc[$n] = password_hash($new, PASSWORD_DEFAULT); }
        write_json("$DIR/staff_accounts.json", $acc);
        // log those staff out everywhere so the new PIN takes effect
        save_sessions(array_filter(sessions(), function ($x) use ($names) { return !in_array($x['name'], $names, true); }));
        ok();

    default:
        fail('Unknown action', 404);
}

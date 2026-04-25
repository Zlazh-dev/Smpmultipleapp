<?php
// logout.php
session_start();

// Hapus semua variabel session
session_unset();

// Hapus session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Hancurkan sesi
session_destroy();

// No-cache headers agar browser tidak cache halaman sebelumnya
header("Cache-Control: no-cache, no-store, must-revalidate, private");
header("Pragma: no-cache");
header("Expires: 0");

// Alihkan ke halaman login Portal
$portal_url = getenv('PORTAL_URL') ?: 'http://portal.localhost';
header("location:" . $portal_url . "/login?pesan=logout");
exit();
?>
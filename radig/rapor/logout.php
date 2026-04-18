<?php
// logout.php
session_start();
// Hapus semua variabel session
session_unset();
// Hancurkan sesi
session_destroy();
// Alihkan ke halaman login
$portal_url = getenv('PORTAL_URL') ?: 'http://portal.localhost';
header("location:" . $portal_url . "/login?pesan=logout");
?>
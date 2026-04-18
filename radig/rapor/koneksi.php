<?php
// File: koneksi.php
// Konfigurasi untuk terhubung ke database MySQL
// Mendukung environment variables (Docker) dan fallback ke default lokal

$host = getenv('DB_HOST') ?: "localhost";
$user = getenv('DB_USER') ?: "root";
$pass = getenv('DB_PASS') ?: "11223344";
$db   = getenv('DB_NAME') ?: "raporsmp";

// Membuat koneksi
$koneksi = mysqli_connect($host, $user, $pass, $db);

// Memeriksa koneksi
if (!$koneksi) {
    die("Koneksi ke database gagal: " . mysqli_connect_error());
}

// Mengatur zona waktu default ke Waktu Indonesia Barat
date_default_timezone_set('Asia/Jakarta');

// --- Pengaturan Versi Aplikasi ---
$APP_VERSION = "v2.0.1";
?>
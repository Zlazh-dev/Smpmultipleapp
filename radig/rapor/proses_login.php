<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// proses_login.php
// DEPRECATED: Direct login is disabled. All authentication goes through Portal SSO.
// This file is kept for backwards compatibility — it redirects to Portal login.
$portal_url = getenv('PORTAL_URL') ?: 'http://portal.localhost';
header("Location: " . $portal_url . "/login");
exit();

// ── Original code below kept for reference (unreachable) ──
session_start();
include 'koneksi.php';

$username = $_POST['username'];
$password = $_POST['password'];

// --- Langkah 1: Coba login sebagai Guru/Admin ---
$stmt_guru = mysqli_prepare($koneksi, "SELECT id_guru, nama_guru, password, role FROM guru WHERE username = ?");
mysqli_stmt_bind_param($stmt_guru, "s", $username);
mysqli_stmt_execute($stmt_guru);
$result_guru = mysqli_stmt_get_result($stmt_guru);
$cek_guru = mysqli_num_rows($result_guru);

if ($cek_guru > 0) {
    $data_guru = mysqli_fetch_assoc($result_guru);
    if (password_verify($password, $data_guru['password'])) {
        $update_stmt = mysqli_prepare($koneksi, "UPDATE guru SET terakhir_login = NOW() WHERE id_guru = ?");
        mysqli_stmt_bind_param($update_stmt, "i", $data_guru['id_guru']);
        mysqli_stmt_execute($update_stmt);
        mysqli_stmt_close($update_stmt);

        $_SESSION['id_guru'] = $data_guru['id_guru'];
        $_SESSION['nama_guru'] = $data_guru['nama_guru'];
        $_SESSION['role'] = $data_guru['role'];

        header("location:dashboard.php");
        exit();
    } else {
        header("location:index.php?pesan=gagal");
        exit();
    }
} else {
    $stmt_siswa = mysqli_prepare($koneksi, "SELECT id_siswa, nama_lengkap, password FROM siswa WHERE username = ? AND status_siswa = 'Aktif'");
    mysqli_stmt_bind_param($stmt_siswa, "s", $username);
    mysqli_stmt_execute($stmt_siswa);
    $result_siswa = mysqli_stmt_get_result($stmt_siswa);
    $cek_siswa = mysqli_num_rows($result_siswa);

    if ($cek_siswa > 0) {
        $data_siswa = mysqli_fetch_assoc($result_siswa);
        if (password_verify($password, $data_siswa['password'])) {
            $_SESSION['id_siswa'] = $data_siswa['id_siswa'];
            $_SESSION['nama_siswa'] = $data_siswa['nama_lengkap'];
            $_SESSION['role'] = 'siswa';

            header("location:dashboard.php");
            exit();
        } else {
            header("location:index.php?pesan=gagal");
            exit();
        }
        mysqli_stmt_close($stmt_siswa);
    } else {
        header("location:index.php?pesan=gagal");
        exit();
    }
}

if (isset($stmt_guru)) {
    mysqli_stmt_close($stmt_guru);
}
mysqli_close($koneksi);
?>

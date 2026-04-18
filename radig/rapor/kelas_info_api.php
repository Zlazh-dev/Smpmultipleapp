<?php
session_start();
include 'koneksi.php';
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] != 'admin') {
    echo json_encode(['error' => 'Akses ditolak']);
    exit;
}

$id_kelas = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id_kelas == 0) {
    echo json_encode(['error' => 'ID tidak valid']);
    exit;
}

// Ambil info kelas
$q = mysqli_prepare($koneksi, "SELECT k.nama_kelas, ta.tahun_ajaran FROM kelas k JOIN tahun_ajaran ta ON k.id_tahun_ajaran = ta.id_tahun_ajaran WHERE k.id_kelas = ?");
mysqli_stmt_bind_param($q, "i", $id_kelas);
mysqli_stmt_execute($q);
$r = mysqli_stmt_get_result($q);
$kelas_info = mysqli_fetch_assoc($r);
mysqli_stmt_close($q);

if (!$kelas_info) {
    echo json_encode(['error' => 'Kelas tidak ditemukan']);
    exit;
}

// Hitung semua data terkait
$counts = [];

// Siswa
$q = mysqli_prepare($koneksi, "SELECT COUNT(*) as c FROM siswa WHERE id_kelas = ?");
mysqli_stmt_bind_param($q, "i", $id_kelas); mysqli_stmt_execute($q);
$counts['siswa'] = mysqli_fetch_assoc(mysqli_stmt_get_result($q))['c'];
mysqli_stmt_close($q);

// Penilaian
$q = mysqli_prepare($koneksi, "SELECT COUNT(*) as c FROM penilaian WHERE id_kelas = ?");
mysqli_stmt_bind_param($q, "i", $id_kelas); mysqli_stmt_execute($q);
$counts['penilaian'] = mysqli_fetch_assoc(mysqli_stmt_get_result($q))['c'];
mysqli_stmt_close($q);

// Detail Nilai (via penilaian)
$q = mysqli_prepare($koneksi, "SELECT COUNT(*) as c FROM penilaian_detail_nilai WHERE id_penilaian IN (SELECT id_penilaian FROM penilaian WHERE id_kelas = ?)");
mysqli_stmt_bind_param($q, "i", $id_kelas); mysqli_stmt_execute($q);
$counts['detail_nilai'] = mysqli_fetch_assoc(mysqli_stmt_get_result($q))['c'];
mysqli_stmt_close($q);

// Rapor
$q = mysqli_prepare($koneksi, "SELECT COUNT(*) as c FROM rapor WHERE id_kelas = ?");
mysqli_stmt_bind_param($q, "i", $id_kelas); mysqli_stmt_execute($q);
$counts['rapor'] = mysqli_fetch_assoc(mysqli_stmt_get_result($q))['c'];
mysqli_stmt_close($q);

// Guru Mengajar
$q = mysqli_prepare($koneksi, "SELECT COUNT(*) as c FROM guru_mengajar WHERE id_kelas = ?");
mysqli_stmt_bind_param($q, "i", $id_kelas); mysqli_stmt_execute($q);
$counts['guru_mengajar'] = mysqli_fetch_assoc(mysqli_stmt_get_result($q))['c'];
mysqli_stmt_close($q);

// TP Kelas
$q = mysqli_prepare($koneksi, "SELECT COUNT(*) as c FROM tp_kelas WHERE id_kelas = ?");
mysqli_stmt_bind_param($q, "i", $id_kelas); mysqli_stmt_execute($q);
$counts['tp_kelas'] = mysqli_fetch_assoc(mysqli_stmt_get_result($q))['c'];
mysqli_stmt_close($q);

echo json_encode([
    'nama_kelas' => $kelas_info['nama_kelas'],
    'tahun_ajaran' => $kelas_info['tahun_ajaran'],
    'data_terkait' => $counts
]);
?>

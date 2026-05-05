<?php
session_start();
include 'koneksi.php';

// Validasi role Admin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    die("Akses ditolak. Anda bukan admin.");
}

$aksi = $_GET['aksi'] ?? '';

switch ($aksi) {
    case 'tambah':
        $nama_ekskul = $_POST['nama_ekskul'];
        $id_pembina = (int)$_POST['id_pembina'];

        // Ambil tahun ajaran aktif
        $q_ta = mysqli_query($koneksi, "SELECT id_tahun_ajaran FROM tahun_ajaran WHERE status = 'Aktif' LIMIT 1");
        $id_tahun_ajaran = mysqli_fetch_assoc($q_ta)['id_tahun_ajaran'];

        // Validasi sederhana
        if (empty($nama_ekskul) || empty($id_pembina)) {
            $_SESSION['pesan'] = "Gagal! Nama ekskul dan pembina tidak boleh kosong.";
        } else {
            // Gunakan prepared statement untuk keamanan
            $stmt = mysqli_prepare($koneksi, "INSERT INTO ekstrakurikuler (nama_ekskul, id_pembina, id_tahun_ajaran) VALUES (?, ?, ?)");
            mysqli_stmt_bind_param($stmt, "sii", $nama_ekskul, $id_pembina, $id_tahun_ajaran);
            
            if (mysqli_stmt_execute($stmt)) {
                $_SESSION['pesan'] = "Ekstrakurikuler baru berhasil ditambahkan.";
            } else {
                $_SESSION['pesan'] = "Gagal menambahkan data. Error: " . mysqli_error($koneksi);
            }
        }
        break;

    case 'hapus':
        $id_ekskul = (int)$_GET['id'];
        
        // Cascade delete: hapus semua data anak terlebih dahulu (FK constraints)
        mysqli_begin_transaction($koneksi);
        try {
            // 1. Hapus penilaian & kehadiran peserta (grandchild of ekstrakurikuler)
            mysqli_query($koneksi, "DELETE FROM ekskul_penilaian WHERE id_peserta_ekskul IN (SELECT id_peserta_ekskul FROM ekskul_peserta WHERE id_ekskul = $id_ekskul)");
            mysqli_query($koneksi, "DELETE FROM ekskul_kehadiran WHERE id_peserta_ekskul IN (SELECT id_peserta_ekskul FROM ekskul_peserta WHERE id_ekskul = $id_ekskul)");
            // 2. Hapus peserta ekskul (child)
            mysqli_query($koneksi, "DELETE FROM ekskul_peserta WHERE id_ekskul = $id_ekskul");
            // 3. Hapus tujuan ekskul (child)
            mysqli_query($koneksi, "DELETE FROM ekskul_tujuan WHERE id_ekskul = $id_ekskul");
            // 4. Hapus ekstrakurikuler (parent)
            $stmt = mysqli_prepare($koneksi, "DELETE FROM ekstrakurikuler WHERE id_ekskul = ?");
            mysqli_stmt_bind_param($stmt, "i", $id_ekskul);
            mysqli_stmt_execute($stmt);

            mysqli_commit($koneksi);
            $_SESSION['pesan'] = "Ekstrakurikuler beserta seluruh data peserta dan penilaian berhasil dihapus.";
        } catch (Exception $e) {
            mysqli_rollback($koneksi);
            $_SESSION['pesan'] = "Gagal menghapus data. Error: " . $e->getMessage();
        }
        break;
    
    // Kita akan menambahkan case 'update' di sini nanti
    
    default:
        $_SESSION['pesan'] = "Aksi tidak valid.";
        break;
}

// Redirect kembali ke halaman utama manajemen ekskul
header("Location: admin_ekskul.php");
exit();
?>
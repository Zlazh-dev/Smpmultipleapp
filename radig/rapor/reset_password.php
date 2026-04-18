<?php
require __DIR__ . '/koneksi.php';
$hash = password_hash('admin123', PASSWORD_BCRYPT);
$sql = "UPDATE guru SET password='$hash' WHERE username='admin'";
if (mysqli_query($koneksi, $sql)) {
    echo "Password admin berhasil direset ke: admin123\n";
    echo "Hash: $hash\n";
} else {
    echo "Error: " . mysqli_error($koneksi) . "\n";
}
mysqli_close($koneksi);
?>

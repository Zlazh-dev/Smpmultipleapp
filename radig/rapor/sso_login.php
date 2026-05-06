<?php
/**
 * SSO Login Receiver for RADIG
 * Receives a JWT token from Portal, verifies it, and creates a PHP session.
 *
 * Identity is centralized in Portal. This endpoint:
 *   1. Verifies the JWT signature
 *   2. Looks up guru by portal_user_id (primary), username (fallback), or nip (fallback)
 *   3. Auto-creates guru if not found (auto-provision)
 *   4. Auto-links portal_user_id for future fast lookups
 *
 * URL: /sso_login.php?token=xxx
 */
session_start();
include 'koneksi.php';

// Self-heal: ensure portal_user_id column exists (survives DB migrations/restores)
try { mysqli_query($koneksi, "ALTER TABLE guru ADD COLUMN portal_user_id VARCHAR(36) UNIQUE DEFAULT NULL"); } catch (Exception $e) {}

$portal_url = getenv('PORTAL_URL') ?: 'http://portal.localhost';

$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($token)) {
    header("location:" . $portal_url . "/login?pesan=sso_no_token");
    exit;
}

// ── JWT Verification (HMAC-SHA256 / HS256, JWS standard) ──
$sso_secret = getenv('SSO_JWT_SECRET');
if (!$sso_secret) {
    $sso_secret = getenv('NEXTAUTH_SECRET');
}
if (!$sso_secret) {
    error_log('FATAL: SSO_JWT_SECRET and NEXTAUTH_SECRET are both missing. SSO login is disabled.');
    header("location:" . $portal_url . "/login?pesan=sso_misconfigured");
    exit;
}

$parts = explode('.', $token);
if (count($parts) !== 3) {
    header("location:" . $portal_url . "/login?pesan=sso_invalid_format");
    exit;
}

list($header_b64, $payload_b64, $signature_b64) = $parts;

// Verify header is HS256
$header_json = base64_decode(strtr($header_b64, '-_', '+/'));
$header = json_decode($header_json, true);
if (!$header || !isset($header['alg']) || $header['alg'] !== 'HS256') {
    header("location:" . $portal_url . "/login?pesan=sso_invalid_alg");
    exit;
}

// Verify signature using HMAC-SHA256
$signing_input = "$header_b64.$payload_b64";
$expected_sig = hash_hmac('sha256', $signing_input, $sso_secret, true);
$expected_sig_b64 = rtrim(strtr(base64_encode($expected_sig), '+/', '-_'), '=');

if (!hash_equals($expected_sig_b64, $signature_b64)) {
    error_log("SSO JWT signature mismatch.");
    header("location:" . $portal_url . "/login?pesan=sso_invalid_sig");
    exit;
}

// Decode payload
$payload_json = base64_decode(strtr($payload_b64, '-_', '+/'));
$payload = json_decode($payload_json, true);

if (!$payload) {
    header("location:" . $portal_url . "/login?pesan=sso_invalid_payload");
    exit;
}

// Check expiration
if (isset($payload['exp']) && time() > $payload['exp']) {
    header("location:" . $portal_url . "/login?pesan=sso_expired");
    exit;
}

// Check issuer
if (!isset($payload['iss']) || $payload['iss'] !== 'portal-smpit') {
    header("location:" . $portal_url . "/login?pesan=sso_invalid_issuer");
    exit;
}

// ── Extract identity from JWT ──
$portal_user_id = isset($payload['portalUserId']) ? $payload['portalUserId'] : (isset($payload['sub']) ? $payload['sub'] : null);
$username = isset($payload['username']) ? $payload['username'] : null;
$nip = isset($payload['nip']) ? $payload['nip'] : null;
$name = isset($payload['name']) ? $payload['name'] : null;
$role = isset($payload['role']) ? $payload['role'] : 'Guru';

if (!$portal_user_id) {
    header("location:" . $portal_url . "/login?pesan=sso_no_identity");
    exit;
}

// Disable exception mode for safer queries
mysqli_report(MYSQLI_REPORT_OFF);

// ── 3-Tier Lookup: portal_user_id → username → nip ──
$guru = null;

// Tier 1: Lookup by portal_user_id (fastest — already linked)
$safe_portal_id = mysqli_real_escape_string($koneksi, $portal_user_id);
$query = "SELECT id_guru, nama_guru, role FROM guru WHERE portal_user_id = '$safe_portal_id' LIMIT 1";
$result = @mysqli_query($koneksi, $query);
if ($result && mysqli_num_rows($result) > 0) {
    $guru = mysqli_fetch_assoc($result);
    error_log("SSO: Found guru by portal_user_id='$portal_user_id' → id=" . $guru['id_guru']);
}

// Tier 2: Fallback — lookup by username
if (!$guru && $username) {
    $safe_username = mysqli_real_escape_string($koneksi, $username);
    $query = "SELECT id_guru, nama_guru, role FROM guru WHERE username = '$safe_username' LIMIT 1";
    $result = @mysqli_query($koneksi, $query);
    if ($result && mysqli_num_rows($result) > 0) {
        $guru = mysqli_fetch_assoc($result);
        error_log("SSO: Found guru by username='$username' → id=" . $guru['id_guru']);

        // Auto-link: store portal_user_id for future fast lookups
        $stmt = mysqli_prepare($koneksi, "UPDATE guru SET portal_user_id = ? WHERE id_guru = ?");
        mysqli_stmt_bind_param($stmt, "si", $portal_user_id, $guru['id_guru']);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        error_log("SSO: Auto-linked portal_user_id='$portal_user_id' to guru id=" . $guru['id_guru']);
    }
}

// Tier 3: Fallback — lookup by NIP
if (!$guru && $nip) {
    $safe_nip = mysqli_real_escape_string($koneksi, $nip);
    $query = "SELECT id_guru, nama_guru, role FROM guru WHERE nip = '$safe_nip' LIMIT 1";
    $result = @mysqli_query($koneksi, $query);
    if ($result && mysqli_num_rows($result) > 0) {
        $guru = mysqli_fetch_assoc($result);
        error_log("SSO: Found guru by nip='$nip' → id=" . $guru['id_guru']);

        // Auto-link: store portal_user_id for future fast lookups
        $stmt = mysqli_prepare($koneksi, "UPDATE guru SET portal_user_id = ? WHERE id_guru = ?");
        mysqli_stmt_bind_param($stmt, "si", $portal_user_id, $guru['id_guru']);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        error_log("SSO: Auto-linked portal_user_id='$portal_user_id' to guru id=" . $guru['id_guru']);
    }
}

// ── Auto-Provision: create guru if not found anywhere ──
if (!$guru) {
    // Check siswa table first (students have separate flow)
    $siswa = null;
    if ($username) {
        $safe_username = mysqli_real_escape_string($koneksi, $username);
        $query = "SELECT id_siswa, nama_lengkap FROM siswa WHERE username = '$safe_username' AND status_siswa = 'Aktif' LIMIT 1";
        $result = @mysqli_query($koneksi, $query);
        if ($result && mysqli_num_rows($result) > 0) {
            $siswa = mysqli_fetch_assoc($result);

            // SSO login as siswa
            session_regenerate_id(true);
            $_SESSION['id_siswa'] = $siswa['id_siswa'];
            $_SESSION['nama_siswa'] = $siswa['nama_lengkap'];
            $_SESSION['role'] = 'siswa';
            $_SESSION['sso_login'] = true;

            header("location:dashboard.php");
            exit;
        }
    }

    // Not a siswa either — auto-create as guru
    // Map Portal role to RADIG role
    $radig_role = ($role === 'RADIG' || $role === 'TU') ? 'admin' : 'guru';
    $guru_name = $name ?: $username;
    $guru_username = $username ?: ('portal-' . substr($portal_user_id, 0, 8));

    $stmt = mysqli_prepare($koneksi,
        "INSERT INTO guru (nip, nama_guru, username, password, role, portal_user_id, terakhir_login) VALUES (?, ?, ?, '', ?, ?, NOW())"
    );
    mysqli_stmt_bind_param($stmt, "sssss", $nip, $guru_name, $guru_username, $radig_role, $portal_user_id);

    if (mysqli_stmt_execute($stmt)) {
        $new_id = mysqli_insert_id($koneksi);
        $guru = [
            'id_guru' => $new_id,
            'nama_guru' => $guru_name,
            'role' => $radig_role,
        ];
        error_log("SSO: Auto-provisioned guru id=$new_id, name='$guru_name', portal_user_id='$portal_user_id'");
    } else {
        error_log("SSO: Auto-provision failed: " . mysqli_error($koneksi));
        header("location:" . $portal_url . "/login?pesan=sso_provision_failed");
        exit;
    }
    mysqli_stmt_close($stmt);
}

// ── Create PHP session for guru/admin ──
// Regenerate session ID to prevent session fixation attacks
session_regenerate_id(true);

$_SESSION['id_guru'] = $guru['id_guru'];
$_SESSION['nama_guru'] = $guru['nama_guru'];
$_SESSION['role'] = $guru['role'];
$_SESSION['sso_login'] = true;
$_SESSION['portal_user_id'] = $portal_user_id;

// Update last login time
$stmt = mysqli_prepare($koneksi, "UPDATE guru SET terakhir_login = NOW() WHERE id_guru = ?");
mysqli_stmt_bind_param($stmt, "i", $guru['id_guru']);
mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

header("location:dashboard.php");
exit;
?>

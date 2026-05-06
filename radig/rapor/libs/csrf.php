<?php
/**
 * CSRF Protection Helper
 * 
 * Usage in forms:   <?= csrf_field() ?>
 * Usage in actions:  csrf_verify();  // dies on failure
 */

/**
 * Generate or retrieve the CSRF token for the current session.
 */
function csrf_token(): string {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (empty($_SESSION['_csrf_token'])) {
        $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf_token'];
}

/**
 * Return a hidden input field with the CSRF token.
 */
function csrf_field(): string {
    return '<input type="hidden" name="_csrf_token" value="' . htmlspecialchars(csrf_token()) . '">';
}

/**
 * Verify the CSRF token from POST or GET.
 * Call this at the top of every action file.
 * On failure, sets a session error message and redirects back (or dies).
 */
function csrf_verify(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $token_from_request = $_POST['_csrf_token'] ?? $_GET['_csrf_token'] ?? '';
    $token_from_session = $_SESSION['_csrf_token'] ?? '';

    if (empty($token_from_session) || !hash_equals($token_from_session, $token_from_request)) {
        // Optionally log the attempt
        error_log("CSRF verification failed. IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

        http_response_code(403);
        die('<h3 style="font-family:sans-serif;color:#c00;">⛔ Permintaan ditolak (CSRF token tidak valid).</h3>
             <p style="font-family:sans-serif;">Silakan kembali dan coba lagi. Jika masalah berlanjut, logout dan login ulang.</p>
             <a href="javascript:history.back()" style="font-family:sans-serif;">← Kembali</a>');
    }

    // Token is valid — proceed.
    // Note: Token persists for the session lifetime. 
    // It is regenerated when the session ID changes (login/logout).
}
?>

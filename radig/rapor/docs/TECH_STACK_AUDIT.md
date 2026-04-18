# Tech Stack Audit — Legacy vs Modern

**Role:** Senior Backend Engineer & Legacy Code Auditor  
**Scope:** Rapor Digital (Radig) — codebase under `rapor/`  
**Date:** Based on current codebase scan.

---

## 1. Dependency Management

| Question | Finding |
|----------|---------|
| **Does `composer.json` exist?** | **Yes.** |
| **What is in it?** | Single production dependency: `phpoffice/phpspreadsheet: ^5.0` (Excel export). No framework, no router, no ORM, no validation/HTTP layer. |
| **Conclusion** | Composer is used only for a library. **Strong indicator of legacy/native PHP**: no Laravel, Symfony, CodeIgniter, or Slim. |

```json
// composer.json (excerpt)
{
    "require": {
        "phpoffice/phpspreadsheet": "^5.0"
    }
}
```

---

## 2. Routing Architecture

| Aspect | Finding |
|--------|---------|
| **Single entry point (e.g. `public/index.php` + Router)?** | **No.** There is no `public/` front controller. No central router. |
| **How are requests handled?** | **File-based routing.** User hits a specific script in the URL. |
| **Examples** | `siswa_tambah.php`, `penilaian_aksi.php?aksi=simpan_nilai`, `proses_login.php`, `walikelas_proses_rapor.php`, `kelas_tampil.php`, etc. |
| **Conclusion** | **Legacy.** One URL = one file. No named routes, no middleware stack, no route parameters. |

---

## 3. Code Structure (MVC vs Spaghetti)

| Check | Finding |
|-------|---------|
| **Logic and HTML in the same file?** | **Yes.** Example: `index.php` — DB queries and fetch logic at the top, then large block of HTML/CSS/JS; `siswa_tampil.php` — SQL, then `<table>` and PHP loops for rows. Same pattern in many files. |
| **Class definitions and namespaces in app code?** | **No.** Application PHP files (outside `vendor/`) are **procedural**: no `namespace`, no custom `class`. Only `vendor/` (PhpSpreadsheet) uses OOP. |
| **Typical pattern** | `include 'header.php'; include 'koneksi.php';` → role check → raw queries / `$_GET`/`$_POST` → HTML with embedded `<?php ?>`. |
| **Conclusion** | **Not MVC.** No separation of Model / View / Controller. Presentation and business logic mixed in the same file. |

**Example (siswa_tampil.php):**

- Lines 1–43: includes, `$_GET['id_kelas']`, SQL strings, `mysqli_query` / `mysqli_fetch_assoc`.
- Lines 46–186: CSS and HTML with `<?php echo ... ?>` and `while` loops over `$query_siswa`.

---

## 4. Database Interaction

| Aspect | Finding |
|--------|---------|
| **Connection** | **Native `mysqli_connect`** in `koneksi.php`. Global `$koneksi`. No PDO, no ORM, no query builder. |
| **Query style** | **Mix.** |
| | - **Prepared statements** used in several places (e.g. `penilaian_aksi.php`, `proses_login.php`) with `mysqli_prepare` + `mysqli_stmt_bind_param`. |
| | - **Raw string concatenation** in many others: `mysqli_query($koneksi, "SELECT ... WHERE id_kelas = $id_kelas")` with variables interpolated. IDs are often cast to `(int)` before use, which reduces but does not eliminate risk and is not a substitute for prepared statements. |
| **Where are queries?** | **Hardcoded inside logic/presentation files.** No Repository layer, no dedicated data access layer. Queries live next to HTML and business logic. |
| **Conclusion** | **Legacy.** mysqli only; no Eloquent/Doctrine/Query Builder; SQL as string literals in page/action scripts. |

---

## 5. Security Practices

| Check | Finding |
|-------|---------|
| **Direct use of `$_POST` / `$_GET`?** | **Yes, widespread.** 349 matches across 71 files (excluding vendor). Examples: `$username = $_POST['username'];`, `$id_kelas = isset($_GET['id_kelas']) ? (int)$_GET['id_kelas'] : 0;`. |
| **Central validation/sanitization layer?** | **No.** No framework validation, no single validation/sanitization wrapper. Some ad‑hoc checks (e.g. `strip_tags` in `penilaian_aksi.php`, `(int)` on IDs). |
| **Credentials** | Stored in **plain text** in `koneksi.php` (`$host`, `$user`, `$pass`, `$db`). |
| **Password handling** | **Good:** `password_verify()` and prepared statements in `proses_login.php`. |
| **Conclusion** | **Legacy and risky.** Inputs are not consistently validated or sanitized; superglobals used directly; credentials in code; reliance on casting and scattered checks rather than a clear security layer. |

---

## DELIVERABLE

### Stack Type

**Pure Native PHP (procedural, file-based).**

- No framework (Laravel, CodeIgniter, Symfony, etc.).
- Style is “classic” native PHP: global config, includes, one script per “page” or action, logic and HTML mixed.
- PHP version in use could be 7.x or 8.x (syntax allows it), but **architecture is pre-framework / legacy**.

---

### Maintainability Score: **3 / 10**

(10 = modern/clean, 1 = nightmare spaghetti.)

| Plus | Minus |
|------|--------|
| Composer present (one lib). | No framework, no autoloading for app code. |
| Some use of prepared statements. | Many raw `mysqli_query` with interpolated variables. |
| Shared `header.php` / `footer.php`. | 70+ PHP files in project root; no clear modules. |
| Role checks on sensitive pages. | Logic duplicated (e.g. `hitungDataRaporSiswa()` copy-pasted across files). |
| Passwords hashed, login uses prepared stmt. | No central validation; direct `$_GET`/`$_POST`; credentials in repo. |

---

### Key Risks (if you buy or maintain this)

1. **Security**
   - Direct superglobal use and no central validation: higher risk of XSS, mass assignment, and logic bugs.
   - Some SQL built with variable interpolation; even with `(int)` casting, pattern is fragile and not acceptable for user-controlled data.
   - DB credentials in source; no env-based config.

2. **Maintainability**
   - One “feature” spread across many files (`*_tampil.php`, `*_aksi.php`, `*_tambah.php`, etc.) with no clear boundary between UI and logic.
   - Duplicated business logic (e.g. rapor calculation) → bugs and inconsistencies when rules change.
   - New developers must follow “file naming + include” conventions; no routing or controller map to guide them.

3. **Scalability**
   - No caching, no queue, no service layer; everything in request/response.
   - Hard to add API, jobs, or new frontends without refactoring.

4. **Testing**
   - No framework, no DI, no separation of concerns → unit/integration tests are difficult. Likely “manual only” today.

5. **Deployment / Config**
   - Credentials and environment assumptions in code; moving to 12-factor or multiple environments will require refactoring.

---

## Summary Table

| Criteria | Result |
|---------|--------|
| **Dependency management** | Composer present; only PhpSpreadsheet — **Legacy** |
| **Routing** | File-based; no router — **Legacy** |
| **Structure** | Procedural; logic + HTML mixed; no MVC — **Legacy** |
| **Database** | mysqli only; mixed prepared vs concatenated SQL — **Legacy** |
| **Security** | Direct superglobals; no validation layer; credentials in code — **Legacy / Risk** |

**Verdict:** This is **old-school native PHP** (procedural, file-based routing, no framework). It is **not** “spaghetti at worst” only because there is some structure (header/footer, some prepared statements, role checks), but it is **not modern** and will be costly to extend and secure without a refactor toward a framework or at least clear layers (routing, validation, data access, presentation).

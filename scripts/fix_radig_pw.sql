-- Password: SmpIT2026 (verified bcrypt hash, $2y$ prefix for PHP compat)
UPDATE guru SET password = '$2y$12$eB5vQXnqkcSH0a2XrIpLXugGb1UqKXuCSUVCqeT1WoS5qm26hSWM6' WHERE 1=1;
SELECT username, LEFT(password, 30) as pw FROM guru;

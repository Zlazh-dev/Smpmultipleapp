-- Check if superadmin exists in RADIG
SELECT id_guru, username, nip, nama_guru, role FROM guru WHERE username = 'superadmin' OR nip = 'superadmin';

-- Add superadmin to RADIG if not exists
INSERT INTO guru (nip, nama_guru, username, password, role, terakhir_login)
SELECT 'superadmin', 'Super Administrator', 'superadmin', '$2y$12$eB5vQXnqkcSH0a2XrIpLXugGb1UqKXuCSUVCqeT1WoS5qm26hSWM6', 'admin', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM guru WHERE username = 'superadmin');

-- Verify
SELECT id_guru, username, nip, nama_guru, role FROM guru WHERE username = 'superadmin';

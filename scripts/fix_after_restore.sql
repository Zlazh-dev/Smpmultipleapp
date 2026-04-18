-- Add superadmin back (not in backup)
INSERT INTO guru (nip, nama_guru, username, password, role, terakhir_login)
SELECT 'superadmin', 'Super Administrator', 'superadmin', '$2y$12$eB5vQXnqkcSH0a2XrIpLXugGb1UqKXuCSUVCqeT1WoS5qm26hSWM6', 'admin', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM guru WHERE username = 'superadmin');

-- Show guru with NIP (these will be synced)
SELECT id_guru, username, nip, role FROM guru WHERE nip IS NOT NULL AND nip != '' ORDER BY id_guru;

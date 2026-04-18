-- Fix superadmin and admin roles in TU
UPDATE "Pegawai" SET role = 'KHUSUS', jabatan = 'Admin', "updatedAt" = NOW() WHERE username = 'superadmin';
UPDATE "Pegawai" SET role = 'KHUSUS', jabatan = 'Admin', "updatedAt" = NOW() WHERE username = 'admin';
-- Show results
SELECT username, "namaLengkap", role, jabatan FROM "Pegawai" ORDER BY role DESC, username;

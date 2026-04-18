INSERT INTO `guru` (`id_guru`, `nip`, `nama_guru`, `username`, `password`, `role`, `terakhir_login`, `foto_guru`) VALUES
(4, '199207012016032004', 'ANGGA AGUS KARIYAWAN, S.Pd.,Gr', 'guru-angga', '$2y$10$1zKx7na7aXcn9vidpHFpzuMeRb/.YGTnd5Et3N/2XsSwFza6rKPW6', 'guru', '2025-12-09 05:09:10', NULL),
(7, '198705302022211001', 'DONY PRASTYA KARYA, S.Pd', 'guru-dony', '$2y$10$1zKx7na7aXcn9vidpHFpzuMeRb/.YGTnd5Et3N/2XsSwFza6rKPW6', 'guru', '2026-02-12 09:52:50', NULL),
(8, '197507102010012007', 'EFI YULIANA WIDYANINGSIH, S.Pd', 'guru-efi', '$2y$10$gVyyjxqepQUGdRrkSicuDuODEXHIso99.U/PHpTfMAc/grP4LFtcG', 'guru', '2026-03-25 14:59:33', NULL),
(18, '199509032024211019', 'RANGGA ADI SAPUTRA, S.Pd,. Gr', 'guru-rangga', '$2y$10$gYqmEfhZ1inPewuWuN9aFeiWiqc5jNlD6.C9xS1cNfp/XsXBp0sJe', 'guru', '2026-04-09 07:50:57', NULL)
ON DUPLICATE KEY UPDATE nama_guru=VALUES(nama_guru);

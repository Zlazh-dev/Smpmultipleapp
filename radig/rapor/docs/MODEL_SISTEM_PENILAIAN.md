# Model Diagram Sistem Penilaian — Aplikasi Rapor

Dokumen ini memuat diagram model sistem penilaian dalam aplikasi rapor (format .md, diagram menggunakan Mermaid).

---

## 1. Diagram Entitas & Relasi (Data Penilaian Akademik)

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│     kelas       │       │     penilaian         │       │  mata_pelajaran │
├─────────────────┤       ├──────────────────────┤       ├─────────────────┤
│ id_kelas (PK)   │◄──────│ id_kelas (FK)        │       │ id_mapel (PK)   │
│ nama_kelas      │       │ id_mapel (FK)        │──────►│ nama_mapel      │
│ id_wali_kelas   │       │ id_guru (FK)         │       │ urutan          │
│ id_tahun_ajaran │       │ nama_penilaian       │       └─────────────────┘
└─────────────────┘       │ jenis_penilaian       │
                         │   [Formatif|Sumatif]  │       ┌─────────────────┐
                         │ subjenis_penilaian    │       │      guru        │
                         │   [Sumatif TP|        │       ├─────────────────┤
                         │    SAS|SAT]           │◄──────│ id_guru (PK)    │
                         │ bobot_penilaian       │       │ nama_guru       │
                         │ semester              │       └─────────────────┘
                         │ tanggal_penilaian     │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────────┐  ┌─────────────────────────────┐
         │  penilaian_tp     │  │  penilaian_detail_nilai      │
         ├──────────────────┤  ├─────────────────────────────┤
         │ id_penilaian (FK) │  │ id_penilaian (FK)             │
         │ id_tp (FK)        │  │ id_siswa (FK)                 │
         └────────┬─────────┘  │ nilai (0-100)                 │
                  │            └──────────────┬────────────────┘
                  ▼                           │
         ┌──────────────────┐                 │
         │ tujuan_          │                 │
         │ pembelajaran     │                 │
         ├──────────────────┤                 │
         │ id_tp (PK)        │                 │
         │ deskripsi_tp      │                 ▼
         │ id_mapel, ...     │         ┌─────────────────┐
         └──────────────────┘         │     siswa        │
                                      ├─────────────────┤
                                      │ id_siswa (PK)   │
                                      │ nama_lengkap    │
                                      │ id_kelas        │
                                      └─────────────────┘
```

---

## 2. Diagram Alur Penilaian (Flow)

```mermaid
flowchart LR
    subgraph Input
        A[Guru buat Penilaian] --> B[Pilih Jenis: Formatif / Sumatif]
        B --> C{Sumatif?}
        C -->|Ya| D[Pilih Subjenis: TP / SAS / SAT]
        D --> E[Set Bobot]
        E --> F[Pilih TP jika Sumatif TP]
        C -->|Tidak| G[Formatif - hanya analisis]
        F --> H[Input Nilai 0-100 per Siswa]
        G --> H
    end

    subgraph Proses
        H --> I{jenis = Sumatif?}
        I -->|Ya| J[Masuk ke Hitung Nilai Rapor]
        I -->|Tidak| K[Tidak dipakai di rapor]
        J --> L[Rata-rata Berbobot]
        L --> M[Deskripsi dari TP vs KKM]
        M --> N[Nilai Akhir + Capaian Kompetensi]
    end

    subgraph Output
        N --> O[Rapor Detail Akademik]
        O --> P[Cetak Rapor PDF]
    end
```

---

## 3. Diagram Jenis & Subjenis Penilaian

```mermaid
flowchart TB
    subgraph Penilaian
        P[Penilaian]
    end

    P --> F[Formatif]
    P --> S[Sumatif]

    F --> F1[Untuk analisis guru saja]
    F1 --> F2[Tidak masuk nilai rapor]

    S --> S1[Sumatif TP]
    S --> S2[Sumatif Akhir Semester]
    S --> S3[Sumatif Akhir Tahun]

    S1 --> S1a[Per Tujuan Pembelajaran]
    S1 --> S1b[Punya bobot]
    S1 --> S1c[Digunakan untuk deskripsi TP]

    S2 --> S2a[SAS - UAS Ganjil/Genap]
    S3 --> S3a[SAT - Akhir Tahun]

    S2a --> R[Nilai Akhir Rapor]
    S3a --> R
    S1c --> R
```

---

## 4. Diagram Perhitungan Nilai Akhir (Rata-rata Berbobot)

```mermaid
flowchart LR
    subgraph Komponen
        N1["Nilai₁ × Bobot₁"]
        N2["Nilai₂ × Bobot₂"]
        N3["Nilaiₙ × Bobotₙ"]
    end

    N1 --> SUM["Σ (nilai × bobot)"]
    N2 --> SUM
    N3 --> SUM

    SUM --> DIV["÷"]
    BOBOT["Σ bobot"] --> DIV
    DIV --> NA["Nilai Akhir (bulat)"]

    style NA fill:#90EE90
```

**Rumus:**  
`Nilai Akhir = round( Σ(nilai × bobot) / Σ(bobot) )`

---

## 5. Diagram Pembuatan Deskripsi Capaian Kompetensi

```mermaid
flowchart TB
    subgraph Data_Sumber
        A[Skor per TP dari Sumatif TP]
        B[KKM dari pengaturan]
    end

    A --> C[Untuk setiap TP: hitung rata-rata nilai]
    B --> C

    C --> D{Rata-rata TP ≥ KKM?}
    D -->|Ya| E[TP Dikuasai]
    D -->|Tidak| F[TP Perlu Penguatan]

    E --> G["Kalimat: 'Menunjukkan penguasaan yang baik dalam ...'"]
    F --> H["Kalimat: 'Perlu penguatan dalam ...'"]

    G --> I[Deskripsi Final]
    H --> I

    I --> J[Simpan ke rapor_detail_akademik.capaian_kompetensi]
```

---

## 6. Diagram Konteks Rapor (Rapor vs Penilaian vs Kokurikuler/Ekskul)

```mermaid
flowchart TB
    subgraph Akademik
        PEN[Penilaian Sumatif]
        PEN --> PDN[penilaian_detail_nilai]
        PDN --> HITUNG[Hitung Nilai Akhir]
        HITUNG --> RDA[rapor_detail_akademik]
    end

    subgraph Kokurikuler
        KK[kokurikuler_asesmen]
        KK --> NK[nilai_kualitatif]
        NK --> DESK_K[Deskripsi Kokurikuler]
    end

    subgraph Ekstrakurikuler
        EP[ekskul_penilaian]
        EP --> NIL_E[Sangat Baik / Baik / Cukup / Kurang]
        NIL_E --> DESK_E[Keterangan Ekskul]
    end

    RDA --> RAPOR[Rapor Siswa]
    DESK_K --> RAPOR
    DESK_E --> RAPOR

    RAPOR --> PDF[Cetak PDF]
```

---

## 7. Tabel Ringkas Referensi

| Konsep | Keterangan |
|--------|------------|
| **Jenis penilaian** | Formatif (analisis) / Sumatif (nilai rapor) |
| **Subjenis Sumatif** | Sumatif TP, Sumatif Akhir Semester, Sumatif Akhir Tahun |
| **Bobot** | Integer ≥ 1, dipakai dalam rata-rata berbobot |
| **Nilai per siswa** | 0–100 (penilaian_detail_nilai.nilai) |
| **KKM** | Dari tabel `pengaturan` (nama_pengaturan = 'kkm'), default 75 |
| **Nilai akhir** | Rata-rata berbobot dari semua penilaian Sumatif mapel tersebut |
| **Deskripsi** | Dibuat dari ketercapaian TP (≥ KKM = dikuasai, &lt; KKM = perlu penguatan) |

---

*Dibuat dari analisis kode aplikasi rapor. Diagram Mermaid dapat dirender di GitHub, GitLab, atau viewer Markdown yang mendukung Mermaid.*

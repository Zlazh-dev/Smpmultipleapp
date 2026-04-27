# 🚀 SMPIT Asy-Syadzili — Dokumentasi Deployment

## Arsitektur

```
                    ┌──────────────────────────────┐
                    │     Cloudflare Tunnel         │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │   Nginx (bare-metal :80)      │
                    │   Reverse Proxy per subdomain  │
                    └──┬──────────┬──────────┬──────┘
                       │          │          │
              :3000    │   :3001  │   :8080  │
          ┌────▼───┐ ┌──▼──┐  ┌──▼────┐
          │ Portal │ │ TU  │  │ RADIG │
          │Next.js │ │App  │  │ PHP   │
          └───┬────┘ └──┬──┘  └──┬────┘
              │         │        │
         ┌────▼─────────▼──┐ ┌──▼─────┐
         │   PostgreSQL    │ │ MySQL  │
         │ portal + tu db  │ │raporsmp│
         └─────────────────┘ └────────┘
```

| Subdomain | Service | Port Internal | Stack |
|-----------|---------|---------------|-------|
| `portal.smpitasy-syadzili.sch.id` | Portal | 3000 | Next.js 16 |
| `tu.smpitasy-syadzili.sch.id` | TU App | 3001 | Next.js 15 |
| `radig.smpitasy-syadzili.sch.id` | RADIG | 8080 | PHP/Apache |

---

## Prerequisites

### Server
- **OS**: Ubuntu 20.04+ / Oracle Linux
- **Docker**: 24.0+
- **Docker Compose**: v2.20+
- **Git**: terinstall

### Domain & Tunnel
- Cloudflare Tunnel sudah dikonfigurasi → mengarah ke port `:80` di server
- Subdomain sudah aktif di Cloudflare DNS

---

## 📋 Command Reference (Cheat Sheet)

> **Semua command di bawah dijalankan di root project** (`/root/Smpmultipleapp` atau equivalent)

### Deploy Pertama Kali (Fresh Install)

```bash
# 1. Clone repo
git clone https://github.com/Zlazh-dev/Smpmultipleapp.git
cd Smpmultipleapp

# 2. Buat file environment
cp .env.example .env
nano .env   # Ubah semua secret dan URL ke production

# 3. Build & jalankan semua service
docker compose -f docker-compose.prod.yml up -d --build

# 4. Inisialisasi database (sekali saja)
docker compose -f docker-compose.prod.yml exec portal npx prisma db push
docker compose -f docker-compose.prod.yml exec tu-app npx prisma db push
docker compose -f docker-compose.prod.yml exec tu-app npx prisma db push --schema=prisma/radig.prisma

# 5. Seed data awal (opsional)
docker compose -f docker-compose.prod.yml exec portal npx prisma db seed
docker compose -f docker-compose.prod.yml exec tu-app npx prisma db seed
```

### Update / Deploy Perubahan Baru

```bash
# 1. Pull kode terbaru
git pull origin main

# 2. Rebuild & restart service yang berubah
docker compose -f docker-compose.prod.yml up -d --build portal tu-app

# Atau rebuild SEMUA service:
docker compose -f docker-compose.prod.yml up -d --build

# PENTING: Restart Nginx setelah rebuild agar IP baru container terdeteksi:
# - Lokal (Docker Nginx):
docker restart smpit-nginx
# - Produksi (System Nginx):
sudo systemctl restart nginx

# 3. Jika ada perubahan schema database:
docker compose -f docker-compose.prod.yml exec portal npx prisma db push
docker compose -f docker-compose.prod.yml exec tu-app npx prisma db push
```

### Operasi Sehari-hari

```bash
# ---- Status & Monitoring ----
docker compose -f docker-compose.prod.yml ps              # Lihat status semua container
docker compose -f docker-compose.prod.yml logs -f portal   # Live log Portal
docker compose -f docker-compose.prod.yml logs -f tu-app   # Live log TU App
docker compose -f docker-compose.prod.yml logs -f radig    # Live log RADIG
docker compose -f docker-compose.prod.yml logs --tail=100   # 100 baris terakhir semua service

# ---- Restart ----
docker compose -f docker-compose.prod.yml restart portal    # Restart Portal saja
docker compose -f docker-compose.prod.yml restart tu-app    # Restart TU saja
docker compose -f docker-compose.prod.yml restart           # Restart semua

# ---- Stop / Start ----
docker compose -f docker-compose.prod.yml stop              # Stop semua (data tetap aman)
docker compose -f docker-compose.prod.yml start             # Start kembali
docker compose -f docker-compose.prod.yml down              # Stop & hapus container (data tetap di volume)

# ---- Masuk ke container (debug) ----
docker compose -f docker-compose.prod.yml exec portal sh    # Shell ke Portal
docker compose -f docker-compose.prod.yml exec tu-app sh    # Shell ke TU
docker compose -f docker-compose.prod.yml exec postgres psql -U smpit  # Masuk PostgreSQL
```

### Database

```bash
# ---- Backup ----
# PostgreSQL (kedua database)
docker compose -f docker-compose.prod.yml exec postgres pg_dumpall -U smpit > backup_pg_$(date +%Y%m%d).sql

# MySQL (RADIG)
docker compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p raporsmp > backup_mysql_$(date +%Y%m%d).sql

# ---- Restore ----
cat backup_pg_20260426.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U smpit
cat backup_mysql_20260426.sql | docker compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p raporsmp

# ---- Prisma Studio (GUI database browser) ----
# Jalankan di mesin lokal, bukan di server:
cd portal && npx prisma studio
cd tu-app && npx prisma studio
```

### Testing

```bash
# Jalankan di mesin lokal (tidak perlu Docker):
cd portal && npm test        # 23 unit tests
cd tu-app && npm test        # 17 unit tests

# Verbose mode:
cd portal && npx vitest run --reporter=verbose
cd tu-app && npx vitest run --reporter=verbose
```

---

## 🔧 Konfigurasi Environment (.env)

```bash
# ── Database ──
POSTGRES_USER=smpit
POSTGRES_PASSWORD=<GANTI_DENGAN_PASSWORD_KUAT>

MYSQL_ROOT_PASSWORD=<GANTI_DENGAN_PASSWORD_KUAT>
MYSQL_RADIG_USER=radig
MYSQL_RADIG_PASSWORD=<GANTI_DENGAN_PASSWORD_KUAT>

# ── Auth (wajib ganti!) ──
NEXTAUTH_SECRET=<openssl rand -base64 32>
SSO_JWT_SECRET=<openssl rand -base64 32>
SYNC_SECRET=<openssl rand -base64 32>

# ── TU App ──
TU_DEFAULT_PASSWORD=<PASSWORD_DEFAULT_PEGAWAI>

# ── URLs (sesuaikan domain) ──
PORTAL_URL=https://portal.smpitasy-syadzili.sch.id
TU_URL=https://tu.smpitasy-syadzili.sch.id
RADIG_URL=https://radig.smpitasy-syadzili.sch.id
```

> ⚠️ **PENTING**: Jangan pernah commit file `.env` ke git. Generate semua secret dengan `openssl rand -base64 32`

---

## 🔥 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Container crash loop | `docker compose -f docker-compose.prod.yml logs <service>` — cek error |
| Database connection refused | Pastikan postgres/mysql sudah `healthy`: `docker compose -f docker-compose.prod.yml ps` |
| 502 Bad Gateway | Container belum ready. Tunggu 10-15 detik setelah start |
| Redirect loop | `docker compose -f docker-compose.prod.yml restart portal tu-app` — clear stale cache |
| Halaman lama (cache) | Hard refresh: `Ctrl+Shift+R` di browser |
| Disk penuh | `docker system prune -a --volumes` — hapus image & container lama |
| Port sudah terpakai | `docker compose -f docker-compose.prod.yml down` lalu cek `ss -tlnp` |

---

## 📂 Struktur Project

```
Smpmultipleapp/
├── portal/                  # Next.js 16 — SSO Portal & Landing Page
│   ├── Dockerfile
│   ├── __tests__/           # Vitest unit tests
│   ├── src/
│   └── prisma/
├── tu-app/                  # Next.js 15 — Tata Usaha
│   ├── Dockerfile
│   ├── __tests__/           # Vitest unit tests
│   ├── src/
│   └── prisma/
├── radig/                   # PHP/Apache — Rapor Digital
│   └── Dockerfile
├── sync-service/            # Webhook sync (PostgreSQL ↔ MySQL)
├── scripts/
│   └── init-pg.sh           # PostgreSQL multi-database init
├── nginx.conf               # Reverse proxy (dev: Docker nginx)
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
├── .env.example
└── README.md
```

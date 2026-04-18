#!/bin/bash
# ==========================================================
# SmpMultipleApp — Production Setup Script
# Run AFTER Docker is installed and user re-logged in
# ==========================================================
set -e

echo "🚀 SmpMultipleApp Production Setup"
echo "==================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install Docker first."
    exit 1
fi

echo "✓ Docker found: $(docker --version)"

# --- Generate secrets ---
echo ""
echo "📝 Generating secrets..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SSO_JWT_SECRET=$(openssl rand -base64 32)
PG_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)
MYSQL_ROOT_PW=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)
MYSQL_RADIG_PW=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)

# --- Create .env ---
cd ~/Smpmultipleapp
cat > .env << EOF
# Auto-generated $(date)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
SSO_JWT_SECRET=${SSO_JWT_SECRET}
PORTAL_URL=https://portal.smpitasy-syadzili.sch.id
TU_URL=https://tu.smpitasy-syadzili.sch.id
RADIG_URL=https://radig.smpitasy-syadzili.sch.id
POSTGRES_USER=smpit
POSTGRES_PASSWORD=${PG_PASSWORD}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PW}
MYSQL_RADIG_USER=radig
MYSQL_RADIG_PASSWORD=${MYSQL_RADIG_PW}
TU_DEFAULT_PASSWORD=Smpit2026
EOF

echo "✓ .env created with generated secrets"

# --- Nginx configs ---
echo ""
echo "📝 Creating Nginx configs..."

SECURITY_HEADERS='
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;'

# Portal
sudo tee /etc/nginx/sites-available/portal.smpitasy-syadzili.sch.id > /dev/null << 'NGINX'
server {
    listen 80;
    server_name portal.smpitasy-syadzili.sch.id;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# RADIG (overwrite old config)
sudo tee /etc/nginx/sites-available/radig.smpitasy-syadzili.sch.id > /dev/null << 'NGINX'
server {
    listen 80;
    server_name radig.smpitasy-syadzili.sch.id;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 64M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# TU
sudo tee /etc/nginx/sites-available/tu.smpitasy-syadzili.sch.id > /dev/null << 'NGINX'
server {
    listen 80;
    server_name tu.smpitasy-syadzili.sch.id;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable sites
sudo ln -sf /etc/nginx/sites-available/portal.smpitasy-syadzili.sch.id /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/tu.smpitasy-syadzili.sch.id /etc/nginx/sites-enabled/
# radig already in sites-enabled (updated in-place)

sudo nginx -t && sudo systemctl reload nginx
echo "✓ Nginx configs created and loaded"

# --- Cloudflare Tunnel ---
echo ""
echo "📝 Updating Cloudflare Tunnel..."

sudo tee /etc/cloudflared/config.yml > /dev/null << 'CF'
tunnel: 8bce1b86-ba05-4ce7-a94d-523d6068c4c2
credentials-file: /etc/cloudflared/8bce1b86-ba05-4ce7-a94d-523d6068c4c2.json

ingress:
  - hostname: smpitasy-syadzili.sch.id
    service: http://localhost:80
  - hostname: portal.smpitasy-syadzili.sch.id
    service: http://localhost:80
  - hostname: radig.smpitasy-syadzili.sch.id
    service: http://localhost:80
  - hostname: tu.smpitasy-syadzili.sch.id
    service: http://localhost:80
  - hostname: console.smpitasy-syadzili.sch.id
    service: ssh://localhost:2222
  - service: http_status:404
CF

# Add DNS records for new subdomains
sudo cloudflared tunnel route dns 8bce1b86-ba05-4ce7-a94d-523d6068c4c2 portal.smpitasy-syadzili.sch.id 2>/dev/null || true
sudo cloudflared tunnel route dns 8bce1b86-ba05-4ce7-a94d-523d6068c4c2 tu.smpitasy-syadzili.sch.id 2>/dev/null || true

sudo systemctl restart cloudflared
echo "✓ Cloudflare tunnel updated"

# --- Firewall ---
echo ""
echo "📝 Enabling firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✓ Firewall enabled"

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  cd ~/Smpmultipleapp"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo "  docker compose -f docker-compose.prod.yml exec portal npx prisma db push"
echo "  docker compose -f docker-compose.prod.yml exec tu-app npx prisma db push"
echo ""
echo "Generated .env stored at: ~/Smpmultipleapp/.env"
echo "=========================================="

# Panduan Deployment LokaClean

Panduan ini menjelaskan cara men-deploy dan meng-update aplikasi LokaClean di VPS (Ubuntu/Debian) dengan domain `lokaclean.com`.

## Prasyarat
- VPS dengan Ubuntu 20.04/22.04 LTS
- Domain `lokaclean.com` yang sudah diarahkan ke IP VPS
- Akses SSH ke VPS

## 1. Persiapan VPS (Initial Setup)

### A. Install Dependencies Dasar & SEO Libs (PENTING)

Jika ini pertama kali deploy, jalankan perintah berikut di VPS.
**Note:** Kita perlu install library tambahan untuk `react-snap` (SEO Prerendering) agar bisa berjalan di VPS.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Process Manager (PM2) & Nginx
sudo npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx

# Install Database (PostgreSQL)
sudo apt install -y postgresql postgresql-contrib

# --- KHUSUS SEO PRERENDERING ---
# Install library Chrome/Puppeteer agar build frontend berhasil
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 \
libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

## 2. Setup Aplikasi (Pertama Kali)

```bash
# Clone repository (ganti URL dengan repo Anda)
git clone https://github.com/Firmanstmik/LokaClean-Cleaning-Service-Marketplace-Web-PWA-.git lokaclean
cd lokaclean

# Install dependencies root
npm install

# Setup Backend
cd backend
npm install
cp .env.example .env
# EDIT .env sesuai konfigurasi production!
# nano .env
npx prisma migrate deploy
npx prisma db seed
npm run build
cd ..

# Setup Frontend
cd frontend
npm install
cp .env.example .env
# EDIT .env: VITE_API_BASE_URL=/api
# nano .env
npm run build
cd ..
```

## 3. Konfigurasi Nginx

Buat file config: `sudo nano /etc/nginx/sites-available/lokaclean`

```nginx
server {
    server_name lokaclean.com www.lokaclean.com;

    # Frontend (Static Files)
    location / {
        root /var/www/lokaclean/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        client_max_body_size 10M; # Allow larger uploads (photos)
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Uploads Folder
    location /uploads/ {
        alias /var/www/lokaclean/backend/uploads/;
    }
}
```

Aktifkan config:
```bash
sudo ln -s /etc/nginx/sites-available/lokaclean /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

SSL (HTTPS):
```bash
sudo certbot --nginx -d lokaclean.com -d www.lokaclean.com
```

## 4. Menjalankan Aplikasi dengan PM2

```bash
cd backend
pm2 start dist/server.js --name "lokaclean-api"
pm2 save
pm2 startup
```

---

## 5. Cara UPDATE Aplikasi (Rutin)
 
Setiap kali ada perubahan di GitHub (seperti perbaikan tampilan mobile atau update SEO), lakukan langkah ini di VPS:
 
1. **Masuk ke direktori project:**
   ```bash
   cd ~/lokaclean
   ```

2. **Jalankan Script Update Otomatis:**
   Saya sudah buatkan script `update.sh` untuk mengotomatisasi pull, install, build, dan restart.
   
   **Pertama kali (beri izin execute):**
   ```bash
   chmod +x update.sh install_seo_deps.sh
   ```
   
   **Jalankan update:**
   ```bash
   ./update.sh
   ```
   
   *Script ini akan otomatis:*
   - `git pull`
   - Install dependencies & Build Frontend (termasuk Prerendering SEO)
   - Install dependencies & Build Backend
   - Migrate database (jika perlu)
   - Restart PM2
 
3. **Jika Build Gagal (Error Chrome/Puppeteer):**
   Jika `npm run build` di frontend gagal dengan error terkait Chrome/Puppeteer, jalankan script ini sekali saja:
   ```bash
   sudo ./install_seo_deps.sh
   ```
   Lalu coba `./update.sh` lagi.

---

## Troubleshooting

- **Error Permission:** Gunakan `sudo` atau `chown` jika ada masalah izin file.
- **Halaman 404:** Pastikan konfigurasi Nginx `try_files $uri $uri/ /index.html;` sudah benar.
- **Database Error:** Cek `.env` di backend dan pastikan database service berjalan.

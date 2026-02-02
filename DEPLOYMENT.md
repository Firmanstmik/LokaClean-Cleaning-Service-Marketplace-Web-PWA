# Panduan Deployment LokaClean

Panduan ini menjelaskan cara men-deploy dan meng-update aplikasi LokaClean di VPS (Ubuntu/Debian) dengan domain `lokaclean.com`.

## Prasyarat
- VPS dengan Ubuntu 20.04/22.04 LTS
- Domain `lokaclean.com` yang sudah diarahkan ke IP VPS
- Akses SSH ke VPS

## 1. Persiapan VPS (Initial Setup)

Jika ini pertama kali deploy, jalankan perintah berikut di VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Process Manager (PM2) & Nginx
sudo npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx

# Install Database (PostgreSQL) - Opsional jika pakai database lokal
sudo apt install -y postgresql postgresql-contrib
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

Setiap kali ada perubahan di GitHub (seperti perbaikan tampilan mobile yang baru saja dilakukan), lakukan langkah ini di VPS:

1. **Masuk ke direktori project:**
   ```bash
   cd ~/lokaclean  # atau /var/www/lokaclean tergantung lokasi install
   ```

2. **Tarik perubahan terbaru:**
   ```bash
   git pull origin main
   ```

3. **Build ulang Frontend (jika ada perubahan tampilan):**
   ```bash
   cd frontend
   npm install      # jaga-jaga ada library baru
   npm run build    # PENTING: ini yang mengupdate tampilan
   cd ..
   ```

4. **Restart Backend (jika ada perubahan logic/API):**
   ```bash
   cd backend
   npm install      # jaga-jaga ada library baru
   npm run build    # compile ulang typescript
   npx prisma migrate deploy # jika ada perubahan database
   pm2 restart lokaclean-api
   cd ..
   ```

5. **Selesai!** Cek website `lokaclean.com`.

---

## Troubleshooting

- **Error Permission:** Gunakan `sudo` atau `chown` jika ada masalah izin file.
- **Halaman 404:** Pastikan konfigurasi Nginx `try_files $uri $uri/ /index.html;` sudah benar.
- **Database Error:** Cek `.env` di backend dan pastikan database service berjalan.

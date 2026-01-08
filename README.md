# LokaClean — Cleaning Service Marketplace (Web & PWA)

<div align="center">
  <img src="docs/img/logo.png" alt="LokaClean Logo" width="150" height="150" />
</div>

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

<div align="center">
  <img src="docs/img/screenshot.png" alt="LokaClean Screenshot" width="800" />
  <p><em>Tampilan Aplikasi LokaClean</em></p>
</div>

**LokaClean** adalah platform marketplace jasa kebersihan berbasis web dan PWA (Progressive Web App) yang menghubungkan pengguna dengan penyedia layanan kebersihan profesional. Aplikasi ini dirancang dengan pendekatan *mobile-first* untuk memberikan pengalaman pengguna yang mulus, lengkap dengan fitur pemilihan lokasi berbasis peta, manajemen pesanan real-time, dan dukungan multibahasa.

## Fitur Utama

*   🧹 **Pemesanan Fleksibel**: Berbagai pilihan paket kebersihan yang dapat disesuaikan (Mendukung Bahasa Indonesia & Inggris).
*   📍 **Lokasi Berbasis Peta**: Integrasi Leaflet/OpenStreetMap untuk penentuan titik lokasi pembersihan yang akurat.
*   📱 **PWA Ready**: Dapat diinstal dan dijalankan layaknya aplikasi native di perangkat mobile.
*   💳 **Pembayaran Terintegrasi**: Dukungan gateway pembayaran (Midtrans) untuk transaksi yang aman dan mudah.
*   🔔 **Real-time Updates**: Notifikasi status pesanan dan sistem pelacakan progres layanan.
*   ⭐ **Ulasan & Rating**: Sistem penilaian untuk menjaga kualitas layanan mitra kebersihan.
*   🛠️ **Admin Dashboard**: Panel admin untuk manajemen pengguna, paket, pesanan, dan laporan keuangan.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Leaflet.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
*   **Lainnya**: JWT Authentication, PWA Support.

## Struktur Project

This repository contains:

- **`backend/`**: Node.js + Express + TypeScript REST API, PostgreSQL via Prisma, JWT auth, role-based access, and photo upload support.
- **`frontend/`**: React + TypeScript + Vite + Tailwind UI, mobile-first, PWA-ready, with map-based location picking (Leaflet/OpenStreetMap).

### Quick start (local)

- **1) Prepare PostgreSQL (NO Docker)**

You can use **local PostgreSQL** (recommended for dev) or a **cloud PostgreSQL** (Neon/Supabase/etc).

Local example (create DB + user once):

```sql
-- Run in psql/pgAdmin:
CREATE USER lokaclean WITH PASSWORD 'lokaclean';
CREATE DATABASE lokaclean OWNER lokaclean;
GRANT ALL PRIVILEGES ON DATABASE lokaclean TO lokaclean;
```

Then set `DATABASE_URL` in `backend/.env` (example below).

- **2) Backend**

```bash
cd backend
cp env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

- **3) Frontend**

```bash
cd frontend
cp env.example .env
npm install
npm run dev
```

### Default seeded admin (local)

- **Email**: `admin@lokaclean.local`
- **Password**: `admin12345`

> Change these immediately for any non-local environment.

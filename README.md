# Absensi Guru (Next.js + Apps Script)

## 1. Update Apps Script
Tempel blok di `apps-script-tambahan.gs` ke bagian bawah Code.gs, ganti API_KEY,
lalu Deploy > Manage deployments > Edit > New version.

## 2. Jalankan lokal
    npm install
    cp .env.example .env.local   # isi GAS_URL dan GAS_KEY
    npm run dev

## 3. Deploy ke Vercel
Push ke GitHub > vercel.com > Add New Project > pilih repo.
Isi Environment Variables: GAS_URL dan GAS_KEY, lalu Deploy.

# AIWIC2026-DelTech — Asisten Pilah Sampah AI

## Description
MVP web berbasis AI yang membantu rumah tangga di Bali memilah sampah dari sumber:
foto sampah → klasifikasi AI → panduan pengolahan spesifik → catatan kontribusi.
Dibangun untuk AI Web Innovation Challenge Bali DigiFest 2026 (Bali Smart Society).

## Problem & Target User
- Masalah: kewajiban pilah sampah dari sumber (2026) belum diikuti kebiasaan warga;
  setelah memilah tidak ada umpan balik/insentif.
- Target user: rumah tangga di banjar/desa adat; sekunder: pengurus banjar.

## Key Features
- [ ] Upload/take photo → klasifikasi AI (organik/plastik/kertas/logam/berbahaya)
- [ ] Panduan pengolahan spesifik per kategori
- [ ] Catat kontribusi "sudah dipilah" → tersimpan di database
- [ ] Riwayat kontribusi mingguan

## Tech Stack
- Frontend: Next.js (React) + Tailwind + PWA
- Backend: Python + FastAPI
- Database: Supabase (PostgreSQL)
- AI: (diisi setelah dipilih — Computer Vision model/API)
- Hosting: Vercel (frontend), Railway (backend), Supabase (DB)

## AI Implementation
(diisi setelah implementasi: model/API, input-output, alasan AI diperlukan)

## Architecture / Data Flow
User (HP/PWA) → Next.js → FastAPI /classify → AI → Supabase (log) → Result

## Installation / Run Instructions
### Backend
cd backend && pip install -r requirements.txt
cp .env.example .env  # isi nilai
uvicorn main:app --reload

### Frontend
cd frontend && npm install
cp .env.local.example .env.local  # isi nilai
npm run dev

## Deployment URL
(diisi setelah deploy)

## Demo Account
(diisi setelah auth siap — jangan simpan password di public repo)

## Known Limitations
- Akurasi model terbatas pada kategori umum
- Butuh koneksi internet untuk klasifikasi

## Third-party Resources / Credits
(diisi: model, dataset, library, template)

## Team Members
- DelTech — (nama anggota & peran)
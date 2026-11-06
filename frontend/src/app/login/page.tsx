"use client";
import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi Ambil Lokasi Otomatis (Reverse Geocoding sederhana menggunakan OpenStreetMap)
  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Ambil nama daerah dari API gratis Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.county || data.address.state;
          setLocation(city);
        } catch (err) {
          setError("Gagal mengambil detail lokasi.");
        }
      }, () => {
        setError("Izin lokasi ditolak. Silakan isi manual.");
      });
    } else {
      setError("Browser tidak mendukung GPS.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      } else {
        // Proses Daftar Baru
        if (!fullName) throw new Error("Nama lengkap wajib diisi.");
        
        // 1. Daftar ke Auth Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName } // Simpan nama di metadata auth
          }
        });
        
        if (authError) throw authError;
        
        // 2. Upload Foto Profil (jika ada) & Update Tabel Profiles
        if (authData.user) {
          let avatarUrl = null;
          
          if (avatarFile) {
            // Buat folder unik untuk setiap user di storage 'avatars'
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
            
            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
              avatarUrl = publicUrlData.publicUrl;
            }
          }

          // Update lokasi dan avatar di tabel profiles
          await supabase.from('profiles').update({ 
            location: location,
            avatar_url: avatarUrl
          }).eq('id', authData.user.id);
        }

        alert("Pendaftaran berhasil! Silakan masuk.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <Image src="/logo_sks.png" alt="Logo DelTech" width={80} height={80} className="mx-auto mb-1 rounded-2xl" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isLogin ? "Selamat Datang" : "Buat Akun Baru"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Mulai pilah sampah, kumpulkan poin.</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-5 text-sm border border-red-100 text-center">{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Field Tambahan Khusus Daftar */}
          {!isLogin && (
            <>
              {/* Foto Profil */}
              <div className="flex flex-col items-center mb-2">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-emerald-500 transition"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">Tambah Foto (Opsional)</p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Misal: Nicky Simanullang" />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lokasi (Kota/Kabupaten)</label>
                <div className="flex gap-2">
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Misal: Denpasar" />
                  <button type="button" onClick={getLocation} className="bg-emerald-100 text-emerald-700 px-4 rounded-xl hover:bg-emerald-200 transition font-medium text-sm shrink-0 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    GPS
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="nama@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="••••••••" />
          </div>
          
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 mt-2">
            {loading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar Sekarang")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-emerald-600 font-semibold hover:text-emerald-700 transition">
            {isLogin ? "Daftar" : "Masuk"}
          </button>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type ClassifyItem = {
  label: string;
  confidence: number;
  reason: string;
  guide: {
    title: string;
    steps: string[];
    tip: string;
  };
};

type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  badges: string[];
  earned_badge: string | null;
  already_scanned_today: boolean;
};

type ClassifyResponse = {
  items: ClassifyItem[];
  saved: boolean;
  streak: StreakInfo;
  points_earned: number;
};

// --- KOMPONEN IKON SVG ---
const IconRecycle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
);
const IconLightbulb = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
);
const IconFire = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
);
const IconTrophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m5-13v3a5 5 0 01-5 5H8a5 5 0 01-5-5V8m18 0v3a5 5 0 01-5 5H8a5 5 0 01-5-5V8m14-4v4a3 3 0 11-6 0V4h6z" /></svg>
);

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- STATE UNTUK WEBCAM LAPTOP ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profileData?.full_name) {
        setFullName(profileData.full_name);
      } else {
        setFullName(session.user.email?.split('@')[0] || "Pengguna");
      }

      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }
    };
    checkUser();
  }, [router]);

  // --- FUNGSI KAMERA ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            stopCamera();
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  // --- FUNGSI UPLOAD FILE/GALERI ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Sesi habis, silakan login kembali.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", image);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/classify`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Gambar tidak valid.");
        }
        if (res.status === 401) throw new Error("Sesi tidak valid. Silakan login ulang.");
        throw new Error("Gagal memproses gambar. Pastikan backend menyala.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPreview(null);
    setImage(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-600 font-medium">Memeriksa sesi...</div>;

  const firstName = fullName.split(' ')[0];
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Image src="/logo_sks.png" alt="DelTech Logo" width={32} height={32} className="object-contain" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">DelTech</h1>
        </div>
        <Link href="/profil" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 pl-1.5 pr-3 py-1.5 rounded-full transition text-sm font-medium text-slate-700">
          <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-emerald-600">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          Profil
        </Link>
      </header>

      <div className="max-w-md mx-auto px-5 mt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Halo, {firstName} 👋</h2>
          <p className="text-slate-500 mt-1 text-sm">Yuk, mulai pilah sampahmu hari ini.</p>
        </div>

        {/* TAMPILAN KAMERA LAPTOP (WEBCAM) */}
        {isCameraOpen && (
          <div className="bg-black rounded-3xl overflow-hidden shadow-lg mb-4 relative flex flex-col">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-auto max-h-[60vh] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
              <button 
                onClick={stopCamera} 
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition"
              >
                Batal
              </button>
              <button 
                onClick={capturePhoto} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                Jepret
              </button>
            </div>
          </div>
        )}

        {/* Area Upload - Dua Pilihan */}
        {!preview && !result && !isCameraOpen && (
          <div className="space-y-4">
            {/* Tombol Kamera (Webcam) */}
            <button 
              onClick={startCamera}
              className="group w-full relative bg-white border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-emerald-50/50 shadow-sm"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-emerald-800 font-bold text-lg mb-1">Buka Kamera</p>
              <p className="text-slate-400 text-xs text-center">Ambil foto sampah secara langsung</p>
            </button>

            {/* Tombol Galeri (Sekunder) */}
            <label className="flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl py-3.5 cursor-pointer transition-colors">
              <svg className="w-5 h-5 text-slate-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm font-semibold text-slate-700">Pilih dari Galeri</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        )}

        {/* Preview & Tombol Proses */}
        {preview && !result && (
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 mb-4">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              {!loading && (
                <button onClick={resetForm} className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-emerald-700 transition disabled:opacity-50 flex justify-center items-center shadow-lg shadow-emerald-200">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menganalisis...
                </span>
              ) : "Pilah Sekarang"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex gap-3 items-start">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p>{error}</p>
          </div>
        )}

        {/* Hasil AI */}
        {result && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
              <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100">
                <img src={preview!} alt="Sampah" className="w-full h-full object-cover" />
              </div>
            </div>

            {result.items?.map((item, index) => (
              <div key={index} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <IconRecycle className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 capitalize">{item.guide.title}</h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{item.reason}"</p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Langkah Pengolahan
                  </h4>
                  <ul className="space-y-2">
                    {item.guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4 text-sm text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex gap-2 items-start">
                  <IconLightbulb className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <p>{item.guide.tip}</p>
                </div>
              </div>
            ))}

            {/* Notifikasi Sukses & Streak */}
            <div className="bg-emerald-600 rounded-3xl p-5 shadow-lg shadow-emerald-200 flex items-center gap-4 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-lg">Berhasil Dicatat!</h4>
                    <p className="text-emerald-100 text-sm">Kamu mendapatkan +{result.points_earned} Poin Hijau.</p>
              </div>
            </div>

            {/* Info Streak Harian (Dinamis) */}
            {result.streak && (
              <>
                {!result.streak.already_scanned_today ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                        <IconFire className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-orange-800 text-lg">Streak {result.streak.current_streak} Hari!</p>
                        <p className="text-xs text-orange-600 font-medium">Jangan lupa scan lagi besok ya.</p>
                      </div>
                    </div>
                    {result.streak.earned_badge && (
                      <div className="bg-orange-200 text-orange-900 text-xs font-bold px-3 py-2 rounded-xl shadow-sm text-center flex flex-col items-center gap-1">
                        <IconTrophy className="w-4 h-4 text-orange-700" />
                        <span>Badge Baru:<br/>{result.streak.earned_badge}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 text-center shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">
                      🔥 Kamu sudah menjaga streak <strong>{result.streak.current_streak} hari</strong> hari ini. Scan lagi besok untuk melanjutkan!
                    </p>
                  </div>
                )}
              </>
            )}
            
            <button onClick={resetForm} className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-2xl hover:bg-slate-50 transition">
              Pindai Sampah Lain
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
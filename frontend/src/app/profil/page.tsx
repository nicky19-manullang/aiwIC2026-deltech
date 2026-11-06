"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

type ProfileData = {
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  total_points: number; 
};

type Contribution = {
  id: string;
  waste_label: string;
  created_at: string;
};

type StreakInfo = {
  current_streak: number;
  longest_streak: number;
  badges: string[];
};

// --- KOMPONEN IKON SVG ---
const IconRecycle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
);
const IconApple = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v2" /></svg>
);
const IconBottle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2h-2.5L13 4.5V3h-2v1.5L9.5 7H7a2 2 0 00-2 2v10a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6" /></svg>
);
const IconBox = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
);
const IconCan = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const IconTrash = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const IconTrophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m5-13v3a5 5 0 01-5 5H8a5 5 0 01-5-5V8m18 0v3a5 5 0 01-5 5H8a5 5 0 01-5-5V8m14-4v4a3 3 0 11-6 0V4h6z" /></svg>
);
const IconLeaf = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
);
const IconFire = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
);

const renderWasteIcon = (label: string) => {
  const className = "h-6 w-6";
  switch (label.toLowerCase()) {
    case "organik": return <IconApple className={className} />;
    case "plastik": return <IconBottle className={className} />;
    case "kertas": return <IconBox className={className} />;
    case "logam": return <IconCan className={className} />;
    default: return <IconTrash className={className} />;
  }
};

export default function Profil() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<Contribution[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({ current_streak: 0, longest_streak: 0, badges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(profileData);
      
      const { data: historyData } = await supabase
        .from("contributions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setHistory(historyData || []);

      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      setStreakInfo(streakData || { current_streak: 0, longest_streak: 0, badges: [] });
      
      setLoading(false);
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-xl bg-slate-200" />
        <div className="h-56 rounded-3xl bg-slate-200" />
        <div className="h-28 rounded-3xl bg-slate-200" />
        <div className="h-48 rounded-3xl bg-slate-200" />
      </div>
    </main>
  );

  if (!user) return null;

  const totalHistory = history.length; 
  const displayName = profile?.full_name || user.email?.split("@")[0] || "Pengguna";
  const initial = displayName.charAt(0).toUpperCase();

  const currentStreak = streakInfo.current_streak;
  let nextMilestone = 10;
  if (currentStreak >= 100) nextMilestone = 365;
  else if (currentStreak >= 50) nextMilestone = 100;
  else if (currentStreak >= 10) nextMilestone = 50;
  
  const progressPercentage = Math.min((currentStreak / nextMilestone) * 100, 100);

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-12">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Kembali ke beranda" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">DelTech</p>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Profil Saya</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pt-7 sm:px-8 sm:pt-10">
        <section className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-emerald-700">Ruang hijau kamu</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Hai, {displayName}!</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Lihat kontribusi dan perjalananmu dalam memilah sampah.</p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Anggota DelTech
          </div>
        </section>

        {/* KARTU UTAMA (Poin & Streak) */}
        <section aria-label="Ringkasan kontribusi" className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-28 right-28 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl" />
          <div className="relative">
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Total Poin Hijau</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-5xl font-extrabold tracking-tight sm:text-6xl">{profile?.total_points || 0}</p>
                  <span className="font-semibold text-emerald-100">poin</span>
                </div>
                <p className="mt-2 text-sm text-emerald-100/90">Kamu sudah mencatat {totalHistory} kontribusi.</p>
              </div>
              <div className="flex items-center gap-3 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur sm:self-auto">
                <IconLeaf className="h-6 w-6 text-emerald-200" />
                <div>
                  <p className="text-xs text-emerald-100">Terus jaga kebiasaan baikmu</p>
                  <p className="text-sm font-bold">Setiap aksi berarti</p>
                </div>
              </div>
            </div>

            {/* Progress Bar Streak */}
            <div className="mb-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs font-medium text-emerald-100 flex items-center gap-1">
                    <IconFire className="h-4 w-4 text-orange-300" /> Streak Saat Ini
                  </p>
                  <p className="text-2xl font-bold">{streakInfo.current_streak} <span className="text-sm font-medium text-emerald-100">hari</span></p>
                </div>
                <p className="text-xs font-medium text-emerald-100 text-right">Target: {nextMilestone} hari</p>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2.5">
                <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-medium text-emerald-100">Rekor Streak</p>
                <p className="mt-1 text-2xl font-bold">{streakInfo.longest_streak} <span className="text-sm font-medium text-emerald-100">hari</span></p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-medium text-emerald-100">Badge Diraih</p>
                <p className="mt-1 text-2xl font-bold">{streakInfo.badges?.length || 0} <span className="text-sm font-medium text-emerald-100">buah</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* KARTU IMPAK */}
        <section className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <IconRecycle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Dampak Nyata untuk Bali</h3>
              <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                Setiap sampah yang kamu pilah dan catat di DelTech membantu mengurangi beban TPA Suwung. Data kontribusimu juga mendukung UMKM Bank Sampah lokal untuk memprediksi ketersediaan komoditas daur ulang.
              </p>
            </div>
          </div>
        </section>

        {/* INFORMASI PENGGUNA */}
        <section aria-label="Informasi pengguna" className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-800 ring-4 ring-emerald-50">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={`Foto profil ${displayName}`} width={80} height={80} unoptimized className="h-full w-full object-cover" />
            ) : initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Informasi akun</p>
            <h3 className="mt-1 truncate text-xl font-bold text-slate-900">{displayName}</h3>
            <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
            {profile?.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {profile.location}, Bali
              </p>
            )}
          </div>
          <div className="hidden h-12 w-px bg-slate-100 sm:block" />
          <p className="max-w-xs text-sm leading-6 text-slate-500">Terima kasih sudah ikut membuat lingkungan lebih bersih.</p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.4fr]">
          {/* KOLEKSI BADGE */}
          <section aria-label="Koleksi badge">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Pencapaian</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Koleksi Badge</h3>
            </div>
            {streakInfo.badges && streakInfo.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {streakInfo.badges.map((badge: string, idx: number) => (
                  <div key={`${badge}-${idx}`} className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                      <IconTrophy className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{badge}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <IconTrophy className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-800">Badge pertamamu menanti</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Capai streak 10 hari untuk membuka badge "Pemula Hijau".</p>
              </div>
            )}
          </section>

          {/* RIWAYAT */}
          <section aria-label="Riwayat kontribusi">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Aktivitas</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Riwayat Terakhir</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">5 terakhir</span>
            </div>

            {history.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <IconRecycle className="h-6 w-6" />
                </div>
                <p className="font-semibold text-slate-800">Belum ada riwayat</p>
                <p className="mt-1 text-sm text-slate-500">Aktivitas pilah sampahmu akan muncul di sini.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {history.map((item, index) => (
                  <div key={item.id} className={`flex items-center gap-4 p-4 sm:px-5 ${index > 0 ? "border-t border-slate-100" : ""}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      {renderWasteIcon(item.waste_label)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold capitalize text-slate-800">{item.waste_label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">✓ Tercatat</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-9 border-t border-slate-200 pt-6">
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3.5 font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 sm:ml-auto sm:w-auto">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar Akun
          </button>
        </div>
      </div>
    </main>
  );
}
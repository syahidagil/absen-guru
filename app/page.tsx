"use client";

import { useEffect, useState } from "react";

type Guru = { id: string; nama: string };
type Init = { sekolah: string; serverTime: number; tz: string; wajibLokasi?: boolean; guru: Guru[] };
type Hasil = { kelas: "ok" | "telat" | "err"; judul: string; isi: string } | null;
type Lokasi = { lat: number; lng: number; akurasi: number };
const STATUS = ["Hadir", "Izin", "Sakit", "Cuti"] as const;

function ambilLokasi(): Promise<Lokasi> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Browser tidak mendukung lokasi."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, akurasi: p.coords.accuracy }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser, lalu coba lagi."
              : "Lokasi tidak terdeteksi. Aktifkan GPS dan coba lagi."
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function Page() {
  const [init, setInit] = useState<Init | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("Hadir");
  const [ket, setKet] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState<Hasil>(null);

  useEffect(() => {
    fetch("/api/init", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Init & { ok?: boolean; pesan?: string }) => {
        if (d.ok === false) throw new Error(d.pesan);
        setInit(d);
        setOffset(d.serverTime - Date.now());
        setId(localStorage.getItem("absenGuruId") ?? "");
        document.title = "Absensi " + d.sekolah;
      })
      .catch((e) => setHasil({ kelas: "err", judul: "Gagal memuat", isi: String(e.message ?? e) }));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date(Date.now() + offset)), 1000);
    setNow(new Date(Date.now() + offset));
    return () => clearInterval(t);
  }, [offset]);

  const tz = init?.tz ?? "Asia/Makassar";
  const parts = now
    ? Object.fromEntries(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        })
          .formatToParts(now)
          .map((p) => [p.type, p.value])
      )
    : null;
  const tanggal = now
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric",
      }).format(now)
    : "Memuat jam server";

  const perluLokasi = status === "Hadir" && !!init?.wajibLokasi;

  async function kirim() {
    if (!id) return setHasil({ kelas: "err", judul: "Nama belum dipilih", isi: "Pilih nama Anda dari daftar." });
    if (!pin) return setHasil({ kelas: "err", judul: "PIN kosong", isi: "Masukkan PIN pribadi Anda." });
    setBusy(true);
    try {
      let lok: Lokasi | null = null;
      if (perluLokasi) {
        setHasil({ kelas: "ok", judul: "Membaca lokasi", isi: "Mohon tunggu sebentar dan izinkan akses lokasi." });
        lok = await ambilLokasi();
      }
      const r = await fetch("/api/absen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pin, status, keterangan: ket, ...(lok ?? {}) }),
      });
      const d = await r.json();
      if (!d.ok) return setHasil({ kelas: "err", judul: "Belum tercatat", isi: d.pesan });
      localStorage.setItem("absenGuruId", id);
      setPin("");
      setHasil({
        kelas: d.status === "Hadir" && d.telat > 0 ? "telat" : "ok",
        judul: `${d.nama}, ${String(d.jam).slice(0, 5)}`,
        isi: d.pesan,
      });
    } catch (e) {
      setHasil({
        kelas: "err",
        judul: "Terjadi kesalahan",
        isi: e instanceof Error ? e.message : "Periksa koneksi internet, lalu coba lagi.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header className="clock">
        <p className="school">{init?.sekolah ?? "Absensi Guru"}</p>
        <p className="time">
          {parts ? `${parts.hour}:${parts.minute}` : "--:--"}
          <span className="sec">{parts?.second ?? "--"}</span>
        </p>
        <p className="date">{tanggal}</p>
      </header>

      <main>
        <div className="field">
          <label htmlFor="nama">Nama guru</label>
          <select id="nama" value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">{init ? "Pilih nama Anda" : "Memuat daftar nama"}</option>
            {init?.guru.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="legend" id="lgStatus">Status kehadiran</span>
          <div className="seg" role="radiogroup" aria-labelledby="lgStatus">
            {STATUS.map((s) => (
              <span key={s} style={{ display: "contents" }}>
                <input type="radio" name="status" id={"s-" + s} checked={status === s} onChange={() => setStatus(s)} />
                <label htmlFor={"s-" + s}>{s}</label>
              </span>
            ))}
          </div>
        </div>

        {status !== "Hadir" && (
          <div className="field">
            <label htmlFor="ket">Keterangan (boleh dikosongkan)</label>
            <textarea
              id="ket"
              maxLength={200}
              placeholder="Contoh: kontrol ke dokter"
              value={ket}
              onChange={(e) => setKet(e.target.value)}
            />
          </div>
        )}

        <button className="go" type="button" onClick={kirim} disabled={busy || !init}>
          {busy ? "Memproses..." : "Catat kehadiran"}
        </button>

        {hasil && (
          <div className={"hasil " + hasil.kelas} role="status" aria-live="polite">
            <strong>{hasil.judul}</strong>
            <span>{hasil.isi}</span>
          </div>
        )}

        <p className="foot">
          {perluLokasi
            ? "Absen hadir hanya bisa dilakukan di area sekolah. Lokasi dibaca sekali saat Anda menekan tombol. "
            : ""}
          Waktu dicatat dari server sekolah, bukan dari jam HP Anda. Absen hanya bisa satu kali per hari.
        </p>
      </main>
    </div>
  );
}

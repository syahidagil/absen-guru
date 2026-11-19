import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";

export const dynamic = "force-dynamic";
export const maxDuration = 60; 
const STATUS = ["Hadir", "Izin", "Sakit", "Cuti"];

function angka(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const id = String(b.id ?? "").slice(0, 20);
    const pin = String(b.pin ?? "").slice(0, 12);
    const status = String(b.status ?? "");
    const keterangan = String(b.keterangan ?? "").slice(0, 200);
    if (!id || !pin || !STATUS.includes(status)) {
      return NextResponse.json({ ok: false, pesan: "Data tidak lengkap." }, { status: 400 });
    }
    return NextResponse.json(
      await callGas({
        action: "absen",
        id,
        pin,
        status,
        keterangan,
        lat: angka(b.lat),
        lng: angka(b.lng),
        akurasi: angka(b.akurasi),
      })
    );
  } catch (e) {
    console.error("ABSEN ERROR:", e);
    return NextResponse.json({ ok: false, pesan: "Gagal mencatat. Coba lagi." }, { status: 502 });
  }
}
import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await callGas({ action: "init" }));
    } catch (e) {
    console.error("INIT ERROR:", e);
    return NextResponse.json({ ok: false, pesan: "Server absensi tidak dapat dihubungi." }, { status: 502 });
  }}

// export async function callGas(payload: Record<string, unknown>) {
//   const url = process.env.GAS_URL;
//   const key = process.env.GAS_KEY;
//   if (!url || !key) throw new Error("GAS_URL / GAS_KEY belum diatur");
//   const res = await fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "text/plain;charset=utf-8" },
//     body: JSON.stringify({ ...payload, key }),
//     redirect: "follow",
//     cache: "no-store",
//   });
//   const text = await res.text();
//   try {
//     return JSON.parse(text);
//   } catch {
//     const bersih = text
//       .replace(/<script[\s\S]*?<\/script>/gi, " ")
//       .replace(/<style[\s\S]*?<\/style>/gi, " ")
//       .replace(/<[^>]+>/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//     console.error("PESAN APPS SCRIPT:", bersih.slice(0, 300));
//     throw new Error("Balasan bukan JSON");
//   }
// }

export async function callGas(payload: Record<string, unknown>) {
  const url = process.env.GAS_URL;
  const key = process.env.GAS_KEY;
  if (!url || !key) throw new Error("GAS_URL / GAS_KEY belum diatur");

  const mulai = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, key }),
      redirect: "follow",
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = await res.text();
    console.log("GAS selesai:", res.status, (Date.now() - mulai) + " ms");
    try {
      return JSON.parse(text);
    } catch {
      const bersih = text
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      console.error("PESAN APPS SCRIPT:", bersih.slice(0, 300));
      throw new Error("Balasan bukan JSON");
    }
  } finally {
    clearTimeout(timer);
  }
}
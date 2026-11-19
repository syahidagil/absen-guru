// ===== TEMPEL DI BAGIAN BAWAH Code.gs =====
// API untuk Next.js. Ganti nilai di bawah dengan teks acak yang panjang,
// dan isi nilai yang sama di GAS_KEY pada Vercel.
const API_KEY = 'GANTI_DENGAN_KUNCI_RAHASIA_PANJANG';

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, pesan: 'Format permintaan salah.' }); }
  if (b.key !== API_KEY) return json_({ ok: false, pesan: 'Tidak diizinkan.' });
  if (b.action === 'init') return json_(getInit());
  if (b.action === 'absen') return json_(submitAbsen(b.id, b.pin, b.status, b.keterangan));
  return json_({ ok: false, pesan: 'Aksi tidak dikenal.' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

import { callAppsScript } from '@/lib/appsScript';

/**
 * GET /api/tst
 * Mengembalikan daftar permintaan TST siswa untuk hari ini s.d. 3 hari
 * ke depan (dibaca dari sheet "tst"), lengkap dengan status jadwal.
 */
export async function GET() {
  try {
    const data = await callAppsScript('getPermintaanTST');
    return Response.json({ ok: true, data });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

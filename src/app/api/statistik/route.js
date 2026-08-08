import { callAppsScript } from '@/lib/appsScript';

/**
 * GET /api/statistik?asalSekolah=...
 * Mengembalikan jumlah siswa per tingkat kelas, opsional difilter asal sekolah.
 * Kosongkan asalSekolah (atau = SEMUA) untuk semua sekolah.
 */
export async function GET(request) {
  const asal = request.nextUrl.searchParams.get('asalSekolah') || '';
  try {
    const data = await callAppsScript('getStatistikTingkat', { asalSekolah: asal });
    return Response.json({ ok: true, data });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

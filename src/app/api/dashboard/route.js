import { callAppsScript } from '@/lib/appsScript';

/**
 * GET /api/dashboard
 * Mengembalikan data gabungan untuk halaman dashboard:
 * - dashboard: getDashboardData()   (KPI, kelas GO, ulang tahun, ringkasan)
 * - bulanan:   getStatistikPendaftarBulanan()
 * - schools:   getDaftarAsalSekolah()  (untuk dropdown filter)
 */
export async function GET() {
  try {
    const [dashboard, bulanan, schools] = await Promise.all([
      callAppsScript('getDashboardData'),
      callAppsScript('getStatistikPendaftarBulanan'),
      callAppsScript('getDaftarAsalSekolah'),
    ]);
    return Response.json({ ok: true, data: { dashboard, bulanan, schools } });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

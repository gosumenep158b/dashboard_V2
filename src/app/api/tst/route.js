import { callAppsScript } from '@/lib/appsScript';

/**
 * GET /api/tst
 * Mengambil permintaan TST dari sheet TST untuk hari ini sampai tiga hari ke depan.
 */
export async function GET() {
  try {
    const data = await callAppsScript('getPermintaanTST');
    return Response.json({ ok: true, data });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}


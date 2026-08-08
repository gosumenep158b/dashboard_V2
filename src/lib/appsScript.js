/**
 * Pemanggil API Google Apps Script (server-side / route handler).
 *
 * Membutuhkan environment variable APPS_SCRIPT_URL, contoh:
 *   https://script.google.com/macros/s/AKfy.../exec
 */

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || '';

const ERROR_NO_URL =
  'Variabel lingkungan APPS_SCRIPT_URL belum diisi. ' +
  'Salin URL Web App Apps Script (berakhiran /exec) lalu set APPS_SCRIPT_URL ' +
  'di file .env.local (untuk lokal) atau Settings -> Environment Variables (untuk Vercel).';

/**
 * Panggil satu endpoint Apps Script.
 * @param {string} action Nama action (getDashboardData, getStatistikTingkat, ...)
 * @param {object} params Parameter query tambahan
 * @returns {Promise<*>} payload `.data` dari respon { ok: true, data }
 */
export async function callAppsScript(action, params = {}) {
  if (!APPS_SCRIPT_URL) {
    throw new Error(ERROR_NO_URL);
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let res;
  try {
    // Cache 60 detik di sisi Next.js supaya Apps Script tidak dipanggil berlebihan.
    res = await fetch(url, { next: { revalidate: 60 } });
  } catch (e) {
    throw new Error('Tidak dapat terhubung ke Apps Script. Pastikan APPS_SCRIPT_URL benar: ' + e.message);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json) {
    throw new Error(
      'Apps Script merespons status ' + res.status +
      '. Pastikan Web App sudah di-deploy ulang setelah menambahkan ApiREST.gs ' +
      'dan aksesnya diatur ke "Anyone".'
    );
  }
  if (!json.ok) {
    throw new Error(json.error || 'Respon tidak OK dari Apps Script.');
  }
  return json.data;
}

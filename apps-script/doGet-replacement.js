/*************************************************************
 * GANTI fungsi doGet() di Code.gs dengan kode di bawah ini.
 *
 * Cara:
 * 1. Buka Code.gs di Apps Script editor.
 * 2. Pilih teks dari "function doGet(e) {" sampai dengan
 *    "}" penutupnya (persis satu blok fungsi), lalu hapus.
 * 3. Tempel kode di bawah ini di posisi yang sama.
 *
 * Pastikan di SELURUH proyek hanya ada SATU "function doGet".
 * Kalau masih ada doGet lama di file lain, hapus — kalau doGet
 * dobel, script tidak bisa disimpan / muncul error.
 *************************************************************/

/**
 * Entry point Web App.
 * - Jika URL memuat parameter "action" -> balas JSON (dipakai aplikasi Vercel).
 * - Jika tidak -> tampilkan halaman HTML lama (Index.html) seperti sebelumnya.
 */
function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var action = String(p.action || '').trim();

  if (action) {
    try {
      return handleApiRequest_(action, p);
    } catch (err) {
      return _apiError_(err && err.message ? err.message : String(err));
    }
  }

  // ===== Perilaku lama: sajikan halaman HTML dashboard =====
  var tpl = HtmlService.createTemplateFromFile('Index');
  return tpl.evaluate()
    .setTitle('Dashboard ' + CONFIG.NAMA_LEMBAGA + ' TA ' + CONFIG.TAHUN_AJARAN)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

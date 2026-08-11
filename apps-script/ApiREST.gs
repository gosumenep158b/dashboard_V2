/*************************************************************
 * ApiREST.gs — REST/JSON API untuk aplikasi Vercel
 *
 * PENTING: File ini TIDAK berisi fungsi doGet().
 * doGet() tetap satu-satunya di Code.gs (sudah dimodifikasi).
 * Fungsi di file ini DIPANGGIL oleh doGet() saat URL memuat
 * parameter "action".
 *
 * Cara pakai:
 * 1. Buka Apps Script editor (dari spreadsheet -> Ekstensi -> Apps Script).
 * 2. Buat file baru bernama "ApiREST" (File -> New -> Script) dan tempel
 *    SELURUH isi file ini.
 * 3. Di Code.gs, GANTI fungsi doGet() yang lama dengan kode doGet() baru
 *    (lihat bagian bawah README / instruksi). Pastikan hanya ada SATU
 *    fungsi doGet di seluruh proyek.
 * 4. Deploy -> New deployment -> Web app -> Execute as "Me", Who has access
 *    = "Anyone" (atau "Anyone with Google account" jika ingin lebih aman).
 * 5. Salin URL Web App (berakhiran /exec) dan isikan ke variabel
 *    APPS_SCRIPT_URL pada aplikasi Vercel.
 *
 * Endpoint yang tersedia (GET):
 *   ?action=ping
 *   ?action=getDashboardData
 *   ?action=getStatistikTingkat&asalSekolah=SMAN 1 SUMENEP
 *   ?action=getStatistikPendaftarBulanan
 *   ?action=getDaftarAsalSekolah
 *   ?action=getDataFasilitasBupel
 *   ?action=getPermintaanTST
 *
 * Semua endpoint mengembalikan JSON:
 *   { ok: true, data: <hasil> }   -> sukses
 *   { ok: false, error: "<pesan>" } -> gagal
 *************************************************************/

/**
 * Proses permintaan API. Dipanggil dari doGet() di Code.gs.
 * @param {string} action Nama action (tanpa parameter "action" -> null)
 * @param {object} params  Seluruh query parameter URL
 * @returns {TextOutput} Respon JSON
 */
function handleApiRequest_(action, params) {
  switch (action) {
    case 'ping':
      return _apiSuccess_({ build: BUILD_VERSION, waktu: new Date().toISOString() });

    case 'getDashboardData':
      return _apiSuccess_(getDashboardData());

    case 'getStatistikTingkat':
      return _apiSuccess_(getStatistikTingkat(params.asalSekolah));

    case 'getStatistikPendaftarBulanan':
      return _apiSuccess_(getStatistikPendaftarBulanan());

    case 'getDaftarAsalSekolah':
      return _apiSuccess_(getDaftarAsalSekolah());

    case 'getDataFasilitasBupel':
      return _apiSuccess_(getDataFasilitasBupel());

    case 'getPermintaanTST':
      return _apiSuccess_(getPermintaanTST());

    default:
      return _apiError_('Action tidak dikenal: ' + action +
        '. Yang tersedia: ping, getDashboardData, getStatistikTingkat, ' +
        'getStatistikPendaftarBulanan, getDaftarAsalSekolah, getDataFasilitasBupel, getPermintaanTST.');
  }
}

/** Buat respon JSON sukses */
function _apiSuccess_(data) {
  return _apiRespond_({ ok: true, data: data });
}

/** Buat respon JSON error */
function _apiError_(message) {
  return _apiRespond_({ ok: false, error: String(message || 'Terjadi kesalahan tidak diketahui.') });
}

/** Bungkus objek menjadi teks JSON */
function _apiRespond_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

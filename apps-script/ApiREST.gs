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

/**
 * Mengambil permintaan TST dari sheet bernama "TST".
 * Baris pertama dianggap sebagai header. Nama kolom dibuat fleksibel
 * agar tetap bekerja dengan variasi seperti Tanggal/Tgl, Nama Siswa/Siswa,
 * dan Kelas/Kelas GO.
 */
function getPermintaanTST() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('TST');
  if (!sheet) {
    throw new Error('Sheet TST tidak ditemukan. Pastikan nama sheet adalah "TST".');
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { dari: _formatTstDate_(new Date()), sampai: _formatTstDate_(_addDays_(new Date(), 3)), total: 0, items: [] };
  }

  var headers = values[0].map(function (header) { return String(header || '').trim(); });
  var normalizedHeaders = headers.map(_normalizeTstHeader_);
  var dateIndex = _findTstHeader_(normalizedHeaders, ['tanggal permintaan tst', 'tanggal', 'tgl', 'tanggal tst', 'jadwal', 'date']);
  if (dateIndex < 0) {
    throw new Error('Kolom tanggal pada sheet TST tidak ditemukan. Gunakan header Tanggal Permintaan TST.');
  }

  var today = _startOfDay_(new Date());
  var until = _endOfDay_(_addDays_(today, 3));
  var items = [];

  values.slice(1).forEach(function (row, rowOffset) {
    var date = _parseTstDate_(row[dateIndex]);
    if (!date || date < today || date > until) return;

    var item = { tanggal: _formatTstDate_(date), jam: '', nama: '', kelas: '', asalSekolah: '', materi: '', status: '', catatan: '', rowNumber: rowOffset + 2 };
    headers.forEach(function (header, index) {
      var value = row[index];
      var key = normalizedHeaders[index];
      if (key === 'jam' || key === 'waktu' || key === 'pukul') item.jam = _formatTstTime_(value);
      else if (['nama', 'namasiswa', 'siswa', 'namalengkap'].indexOf(key) >= 0) item.nama = String(value || '');
      else if (['kelas', 'kelasgo', 'kelastst'].indexOf(key) >= 0) item.kelas = String(value || '');
      else if (['asalsekolah', 'sekolah', 'asal'].indexOf(key) >= 0) item.asalSekolah = String(value || '');
      else if (['materi', 'topik', 'keperluan'].indexOf(key) >= 0) item.materi = String(value || '');
      else if (['status', 'statustst'].indexOf(key) >= 0) item.status = String(value || '');
      else if (['catatan', 'keterangan', 'notes'].indexOf(key) >= 0) item.catatan = String(value || '');
    });
    items.push(item);
  });

  items.sort(function (a, b) {
    return a.tanggal.localeCompare(b.tanggal) || String(a.jam).localeCompare(String(b.jam)) || String(a.nama).localeCompare(String(b.nama));
  });

  return { dari: _formatTstDate_(today), sampai: _formatTstDate_(until), total: items.length, items: items };
}

function _normalizeTstHeader_(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function _findTstHeader_(headers, aliases) {
  for (var i = 0; i < aliases.length; i += 1) {
    var index = headers.indexOf(_normalizeTstHeader_(aliases[i]));
    if (index >= 0) return index;
  }
  return -1;
}

function _parseTstDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  if (!value) return null;
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function _startOfDay_(date) {
  var result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function _endOfDay_(date) {
  var result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function _addDays_(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function _formatTstDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
}

function _formatTstTime_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone() || 'Asia/Jakarta', 'HH:mm');
  }
  return String(value || '');
}

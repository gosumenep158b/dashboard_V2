'use client';

import { useCallback, useEffect, useState } from 'react';
import Topbar from './Topbar';

function sisaHariLabel(n) {
  if (n === 0) return { text: 'Hari ini', cls: 'pill-today' };
  if (n === 1) return { text: 'Besok', cls: 'pill-tomorrow' };
  return { text: n + ' hari lagi', cls: 'pill-later' };
}

function initials(name) {
  return String(name || '?').trim().charAt(0).toUpperCase();
}

export default function Tst() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tst');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json.data);
    } catch (e) {
      setError(e.message || 'Gagal memuat data TST.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="loading-text">Memuat permintaan TST...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error-screen">
        <div className="error-title">Terjadi Kesalahan</div>
        <div className="error-msg">{error}</div>
        <button className="btn btn-primary" onClick={load}>
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!data) return null;

  const items = data.items || [];
  const diag = data.diagnostik || {};

  const groups = {};
  items.forEach((it) => {
    const key = it.tanggalPermintaanISO;
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });
  const groupKeys = Object.keys(groups).sort();

  const rentang =
    diag.rentangMulai && diag.rentangSampai
      ? diag.rentangMulai + ' s.d. ' + diag.rentangSampai
      : '';

  return (
    <>
      <Topbar brandSub="Penjadwalan TST" updated={rentang} onRefresh={load} refreshing={loading} />

      <main className="container">
        {error ? (
          <div className="banner banner-error">
            {error}
            <button className="btn" onClick={load} style={{ marginLeft: 12 }}>
              Coba Lagi
            </button>
          </div>
        ) : null}

        <section className="hero">
          <div className="hero-decor hero-decor-1" />
          <div className="hero-decor hero-decor-2" />
          <div className="hero-content">
            <p className="hero-eyebrow">GO Sumenep · Tes Seleksi Terpadu</p>
            <h1>Permintaan TST Siswa</h1>
            <p className="hero-desc">
              Daftar permintaan TST mulai hari ini sampai 3 hari ke depan, diambil
              langsung dari sheet "tst".
            </p>
            <div className="hero-progress">
              <div className="hero-progress-head">
                <span>{items.length} permintaan dalam rentang tampilan</span>
                {diag.buildVersion ? <strong>v{diag.buildVersion}</strong> : null}
              </div>
            </div>
          </div>
        </section>

        {diag.totalTanggalTakTerbaca > 0 ? (
          <div className="banner banner-error">
            {diag.totalTanggalTakTerbaca} baris di sheet "tst" berisi tanggal yang
            tidak terbaca — periksa format kolom tanggal pada sheet.
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="card">
            <h2>Belum Ada Permintaan</h2>
            <p className="muted">
              Tidak ada permintaan TST dalam 3 hari ke depan.
            </p>
          </div>
        ) : (
          groupKeys.map((key) => (
            <section key={key} className="tst-group">
              <h2 className="tst-group-title">
                {groups[key][0].tanggalPermintaanText}
              </h2>
              <div className="tst-list">
                {groups[key].map((it, i) => {
                  const sisa = sisaHariLabel(it.sisaHari);
                  const jadwal = it.jadwal;
                  return (
                    <div className="card tst-item" key={key + '-' + i}>
                      <div className="tst-item-top">
                        <div className="tst-name">
                          <span className="tst-avatar">{initials(it.namaSiswa)}</span>
                          <div>
                            <div className="tst-nama">{it.namaSiswa}</div>
                            <div className="tst-detail">
                              {it.noHp ? (
                                <a className="tst-phone" href={'tel:' + it.noHp}>
                                  {it.noHp}
                                </a>
                              ) : (
                                'No. HP tidak tersedia'
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={'pill ' + sisa.cls}>{sisa.text}</span>
                      </div>

                      <div className="tst-meta">
                        {it.namaMapelDiminta ? (
                          <span className="tst-chip">Mapel: {it.namaMapelDiminta}</span>
                        ) : null}
                        {jadwal ? (
                          <span className="badge badge-aman">Sudah dijadwalkan</span>
                        ) : (
                          <span className="badge badge-muted">Belum dijadwalkan</span>
                        )}
                      </div>

                      {jadwal ? (
                        <div className="tst-jadwal">
                          <div className="tst-jadwal-row">
                            <strong>Tanggal TST:</strong> {jadwal.tglTst}
                          </div>
                          <div className="tst-jadwal-row">
                            <strong>Jam:</strong> {jadwal.jamTst}
                          </div>
                          <div className="tst-jadwal-row">
                            <strong>Pengajar:</strong> {jadwal.namaPengajar}
                          </div>
                          {jadwal.namaMapel ? (
                            <div className="tst-jadwal-row">
                              <strong>Mapel:</strong> {jadwal.namaMapel}
                            </div>
                          ) : null}
                          {jadwal.kebutuhan ? (
                            <div className="tst-jadwal-row">
                              <strong>Kebutuhan:</strong> {jadwal.kebutuhan}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        <footer className="footer-note">
          Sumber data: sheet "tst" (3 hari ke depan) · GO Sumenep TA 2026–2027
        </footer>
      </main>
    </>
  );
}

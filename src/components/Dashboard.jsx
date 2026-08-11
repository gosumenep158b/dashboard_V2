'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Topbar from './Topbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

ChartJS.defaults.font.family =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const STATUS_CLASS = {
  Aman: 'badge-aman',
  'Hampir Penuh': 'badge-hampir',
  Penuh: 'badge-penuh',
};

const STATUS_DOT = {
  Aman: 'aman',
  'Hampir Penuh': 'hampir',
  Penuh: 'penuh',
};

function formatNumber(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name) {
  return String(name || '?').trim().charAt(0).toUpperCase();
}

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconGauge = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15l3.5-5.5" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const IconCake = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
    <path d="M4 16h16" />
    <path d="M12 11v3" />
    <path d="M12 11c-1 0-2-.5-2-1.5C10 8.5 11 8 12 8s2 .5 2 1.5C14 10.5 13 11 12 11z" />
    <path d="M8 8v2" />
    <path d="M16 8v2" />
  </svg>
);

function KpiCard({ icon: Icon, label, hint, children }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon">
          <Icon />
        </span>
      </div>
      <div className="kpi-value">{children}</div>
      {hint ? <div className="kpi-hint">{hint}</div> : null}
    </div>
  );
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { grid: { display: false } },
  },
};

const BAR_OPTIONS_HORIZONTAL = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
    y: { grid: { display: false } },
  },
};

export default function Dashboard() {
  const [dash, setDash] = useState(null);
  const [statistik, setStatistik] = useState(null);
  const [asal, setAsal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dRes, sRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/statistik?asalSekolah=' + encodeURIComponent(asal)),
      ]);
      const dJson = await dRes.json();
      const sJson = await sRes.json();
      if (!dJson.ok) throw new Error(dJson.error);
      if (!sJson.ok) throw new Error(sJson.error);
      setDash(dJson.data);
      setStatistik(sJson.data);
    } catch (e) {
      setError(e.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [asal]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading && !dash) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="loading-text">Memuat data dari Apps Script...</div>
      </div>
    );
  }

  if (error && !dash) {
    return (
      <div className="error-screen">
        <div className="error-title">Terjadi Kesalahan</div>
        <div className="error-msg">{error}</div>
        <button className="btn btn-primary" onClick={loadAll}>
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!dash) return null;

  const { dashboard, bulanan, schools } = dash;
  const kpi = dashboard.kpi;
  const ringkasan = dashboard.ringkasan;
  const kelasList = dashboard.kelasList;
  const ultah = dashboard.ultah || [];
  const lastUpdate = dashboard.meta && dashboard.meta.lastUpdate;

  const kelasChart = {
    labels: kelasList.slice(0, 12).map((k) => k.kelasGo),
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: kelasList.slice(0, 12).map((k) => k.jumlah),
        backgroundColor: '#dc2626',
        hoverBackgroundColor: '#b91c1c',
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  };

  const tingkatChart = {
    labels: statistik ? statistik.labels : [],
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: statistik ? statistik.data : [],
        backgroundColor: '#ef4444',
        hoverBackgroundColor: '#dc2626',
        borderRadius: 6,
      },
    ],
  };

  const bulananChart = {
    labels: bulanan ? bulanan.labels : [],
    datasets: [
      {
        label: 'Pendaftar',
        data: bulanan ? bulanan.data : [],
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <>
      <Topbar
        brandSub={'Dashboard TA ' + (dashboard.meta.tahunAjaran || '')}
        updated={lastUpdate ? formatDateTime(lastUpdate) : '-'}
        onRefresh={loadAll}
        refreshing={loading}
      />

      <main className="container">
        {error ? (
          <div className="banner banner-error">
            {error}
            <button className="btn" onClick={loadAll} style={{ marginLeft: 12 }}>
              Coba Lagi
            </button>
          </div>
        ) : null}

        <section className="hero">
          <div className="hero-decor hero-decor-1" />
          <div className="hero-decor hero-decor-2" />
          <div className="hero-content">
            <p className="hero-eyebrow">
              {dashboard.meta.lembaga} · Tahun Ajaran {dashboard.meta.tahunAjaran}
            </p>
            <h1>Rekap &amp; Statistik Siswa</h1>
            <p className="hero-desc">
              Pantau jumlah siswa, kapasitas kelas, distribusi asal sekolah,
              dan rekap pendaftar per bulan.
            </p>
            <div className="hero-progress">
              <div className="hero-progress-head">
                <span>
                  Pencapaian target: {formatNumber(kpi.totalSiswa)} dari{' '}
                  {formatNumber(kpi.target)} siswa
                </span>
                <strong>{kpi.progressPercent}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className={'progress-fill ' + (kpi.progressPercent >= 100 ? 'full' : '')}
                  style={{ width: Math.min(100, kpi.progressPercent) + '%' }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid kpi-grid">
          <KpiCard icon={IconUsers} label="Total Siswa" hint="Terdaftar di GO Sumenep">
            {formatNumber(kpi.totalSiswa)}
          </KpiCard>
          <KpiCard icon={IconGrid} label="Kelas GO Aktif" hint="Jumlah kelas/program terdaftar">
            {formatNumber(kpi.totalKelas)}
          </KpiCard>
          <KpiCard icon={IconGauge} label="Status Kelas" hint="Kapasitas per kelas GO">
            <div className="status-chips">
              <span className="chip">
                <span className={'chip-dot ' + STATUS_DOT.Aman} />
                {ringkasan.aman}
              </span>
              <span className="chip">
                <span className={'chip-dot ' + STATUS_DOT['Hampir Penuh']} />
                {ringkasan.hampirPenuh}
              </span>
              <span className="chip">
                <span className={'chip-dot ' + STATUS_DOT.Penuh} />
                {ringkasan.penuh}
              </span>
            </div>
          </KpiCard>
          <KpiCard icon={IconCake} label="Ulang Tahun" hint="Siswa berulang tahun hari ini">
            {formatNumber(ultah.length)}
          </KpiCard>
        </div>

        <div className="grid chart-grid">
          <div className="card">
            <h2>Siswa per Kelas GO (12 teratas)</h2>
            <div className="chart-box">
              <Bar data={kelasChart} options={BAR_OPTIONS_HORIZONTAL} />
            </div>
          </div>

          <div className="card">
            <h2>Distribusi per Tingkat Kelas</h2>
            <div className="toolbar">
              <label>
                Asal Sekolah
                <select value={asal} onChange={(e) => setAsal(e.target.value)}>
                  <option value="">Semua Sekolah</option>
                  {(schools || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <span className="pill">
                {statistik ? formatNumber(statistik.totalSiswa) + ' siswa' : '-'}
              </span>
            </div>
            <div className="chart-box">
              <Bar data={tingkatChart} options={CHART_OPTIONS} />
            </div>
          </div>
        </div>

        <div className="grid chart-grid">
          <div className="card">
            <h2>Pendaftar per Bulan</h2>
            <div className="chart-box">
              <Line data={bulananChart} options={CHART_OPTIONS} />
            </div>
          </div>

          <div className="card">
            <h2>Ulang Tahun Hari Ini ({ultah.length})</h2>
            {ultah.length === 0 ? (
              <p className="muted">Tidak ada siswa yang berulang tahun hari ini.</p>
            ) : (
              <div className="ultah-list">
                {ultah.map((u, i) => (
                  <div className="ultah-item" key={i}>
                    <div className="ultah-avatar">{initials(u.nama)}</div>
                    <div className="ultah-info">
                      <div className="nama">{u.nama}</div>
                      <div className="detail">
                        {u.kelasGo} · {u.tingkat} · {u.asalSekolah}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Kapasitas per Kelas GO</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Kelas GO</th>
                  <th>Tingkat</th>
                  <th>Siswa</th>
                  <th>Kapasitas</th>
                  <th>Sisa</th>
                  <th>Terisi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {kelasList.map((k) => (
                  <tr key={k.kelasGo}>
                    <td className="mono">{k.kelasGo}</td>
                    <td>{k.tingkat}</td>
                    <td>{formatNumber(k.jumlah)}</td>
                    <td>{formatNumber(k.kapasitas)}</td>
                    <td>{formatNumber(k.sisa)}</td>
                    <td>
                      <div className="progress-track" style={{ width: 120 }}>
                        <div
                          className={'progress-fill ' + (k.persen >= 100 ? 'full' : '')}
                          style={{ width: Math.min(100, k.persen) + '%' }}
                        />
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>
                        {k.persen}%
                      </span>
                    </td>
                    <td>
                      <span className={'badge ' + (STATUS_CLASS[k.status] || 'badge-aman')}>
                        {k.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="footer-note">
          Data ditarik langsung dari Google Sheets melalui Apps Script API ·{' '}
          {dashboard.meta.lembaga} TA {dashboard.meta.tahunAjaran}
        </footer>
      </main>
    </>
  );
}

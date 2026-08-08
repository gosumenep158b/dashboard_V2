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
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const STATUS_CLASS = {
  Aman: 'badge-aman',
  'Hampir Penuh': 'badge-hampir',
  Penuh: 'badge-penuh',
};

function formatNumber(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}

function progressClass(pct) {
  if (pct >= 100) return 'full';
  if (pct >= 70) return 'warn';
  return '';
}

const CHART_HEIGHT = { height: 300 };

export default function Dashboard() {
  const [dash, setDash] = useState(null); // { dashboard, bulanan, schools }
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
      <main className="container">
        <p className="muted">Memuat data dari Apps Script...</p>
      </main>
    );
  }

  if (error && !dash) {
    return (
      <main className="container">
        <div className="banner banner-error">{error}</div>
        <button className="btn" onClick={loadAll}>
          Coba lagi
        </button>
      </main>
    );
  }

  if (!dash) return null;

  const { dashboard, bulanan, schools } = dash;
  const kpi = dashboard.kpi;
  const ringkasan = dashboard.ringkasan;
  const kelasList = dashboard.kelasList;
  const ultah = dashboard.ultah || [];
  const lastUpdate = dashboard.meta && dashboard.meta.lastUpdate;

  const kelasChartLabels = kelasList.slice(0, 12).map((k) => k.kelasGo);
  const kelasChartData = kelasList.slice(0, 12).map((k) => k.jumlah);

  const kelasChart = {
    labels: kelasChartLabels,
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: kelasChartData,
        backgroundColor: '#4f46e5',
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  };

  const kelasChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const tingkatChart = {
    labels: statistik ? statistik.labels : [],
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: statistik ? statistik.data : [],
        backgroundColor: '#2563eb',
        borderRadius: 6,
      },
    ],
  };

  const tingkatChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const bulananChart = {
    labels: bulanan ? bulanan.labels : [],
    datasets: [
      {
        label: 'Pendaftar',
        data: bulanan ? bulanan.data : [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#4f46e5',
      },
    ],
  };

  const bulananChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Dashboard {dashboard.meta.lembaga}</h1>
          <div className="subtitle">
            Tahun Ajaran {dashboard.meta.tahunAjaran} ·{' '}
            {lastUpdate
              ? 'Terakhir diperbarui: ' +
                new Date(lastUpdate).toLocaleString('id-ID')
              : 'Data dari Google Sheets'}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={loadAll} disabled={loading}>
            {loading ? 'Memuat...' : 'Segarkan Data'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="banner banner-error">
          {error} <button className="btn" onClick={loadAll}>Coba lagi</button>
        </div>
      ) : null}

      <div className="grid kpi-grid">
        <div className="card kpi-card">
          <div className="label">Total Siswa</div>
          <div className="value">{formatNumber(kpi.totalSiswa)}</div>
          <div className="hint">
            Target {formatNumber(kpi.target)} siswa ·{' '}
            {kpi.progressPercent}%
          </div>
          <div className="progress-track">
            <div
              className={'progress-fill ' + progressClass(kpi.progressPercent)}
              style={{ width: Math.min(100, kpi.progressPercent) + '%' }}
            />
          </div>
        </div>

        <div className="card kpi-card">
          <div className="label">Kelas GO Aktif</div>
          <div className="value">{formatNumber(kpi.totalKelas)}</div>
          <div className="hint">Jumlah kelas/program terdaftar</div>
        </div>

        <div className="card kpi-card">
          <div className="label">Status Kelas</div>
          <div className="value" style={{ fontSize: 24 }}>
            <span className="badge badge-aman">{ringkasan.aman} Aman</span>{' '}
            <span className="badge badge-hampir">
              {ringkasan.hampirPenuh} Hampir Penuh
            </span>{' '}
            <span className="badge badge-penuh">{ringkasan.penuh} Penuh</span>
          </div>
          <div className="hint">Berdasarkan kapasitas per kelas GO</div>
        </div>

        <div className="card kpi-card">
          <div className="label">Ulang Tahun Hari Ini</div>
          <div className="value">{formatNumber(ultah.length)}</div>
          <div className="hint">Siswa yang berulang tahun hari ini</div>
        </div>
      </div>

      <div className="grid chart-grid">
        <div className="card">
          <h2>Siswa per Kelas GO (12 teratas)</h2>
          <div className="chart-box">
            <Bar data={kelasChart} options={kelasChartOptions} />
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
              {statistik
                ? formatNumber(statistik.totalSiswa) + ' siswa'
                : '-'}
            </span>
          </div>
          <div className="chart-box" style={CHART_HEIGHT}>
            <Bar data={tingkatChart} options={tingkatChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid chart-grid">
        <div className="card">
          <h2>Pendaftar per Bulan</h2>
          <div className="chart-box">
            <Line data={bulananChart} options={bulananChartOptions} />
          </div>
        </div>

        <div className="card">
          <h2>Ulang Tahun Hari Ini ({ultah.length})</h2>
          {ultah.length === 0 ? (
            <p className="muted">
              Tidak ada siswa yang berulang tahun hari ini.
            </p>
          ) : (
            <div className="ultah-list">
              {ultah.map((u, i) => (
                <div className="ultah-item" key={i}>
                  <div className="ultah-avatar">
                    {(u.nama || '?').trim().charAt(0).toUpperCase()}
                  </div>
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

      <div className="card mt">
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
                        className={
                          'progress-fill ' + progressClass(k.persen)
                        }
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

      <div className="footer-note">
        Data ditarik langsung dari Google Sheets melalui Apps Script API ·{' '}
        {dashboard.meta.lembaga} TA {dashboard.meta.tahunAjaran}
      </div>
    </main>
  );
}

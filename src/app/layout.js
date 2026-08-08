import './globals.css';

export const metadata = {
  title: 'Dashboard GO Sumenep TA 2026-2027',
  description: 'Rekap dan statistik data siswa GO Sumenep Tahun Ajaran 2026-2027',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

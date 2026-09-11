import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'KeepAlive — Render & Supabase 24/7 Monitor',
  description: 'Automated 24/7 keep-alive and health monitoring for Render backends and Supabase projects.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>KeepAlive Engine — Server-side background monitoring for Render & Supabase</div>
            <div className="font-mono text-slate-600">Vercel Serverless + PostgreSQL</div>
          </div>
        </footer>
      </body>
    </html>
  );
}

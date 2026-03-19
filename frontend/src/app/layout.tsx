import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '../components/ui/ThemeProvider';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'VedaAI – AI Assessment Creator',
  description: 'Create intelligent, structured question papers with AI. Built for modern educators.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} dark-theme`}>
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--surface-3)',
                color: 'var(--ink-primary)',
                border: '1px solid var(--border-bright)',
                borderRadius: '10px',
                fontSize: '13px',
                fontFamily: 'Sora, sans-serif',
              },
              success: { iconTheme: { primary: '#f97316', secondary: 'var(--surface-3)' } },
              error: { iconTheme: { primary: '#f87171', secondary: 'var(--surface-3)' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Cloud Space — Online Computer Rental',
  description: 'ระบบจองคอมพิวเตอร์ Cloud Space ออนไลน์ — เลือกโซน จองเวลา รับโปรโมชั่น',
  keywords: ['Cloud Space', 'computer booking', 'จองคอมพิวเตอร์', 'cloud'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

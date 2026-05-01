/**
 * GemeenteGPT Local — Root Layout
 * RTL Arabic, dark theme, Noto Sans Arabic font
 */

import type { Metadata } from 'next';
import { Noto_Sans_Arabic, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GemeenteGPT Local',
  description: 'مساعد ذكي للإجراءات البيروقراطية الهولندية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${notoArabic.variable} ${jetbrainsMono.variable} font-arabic antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

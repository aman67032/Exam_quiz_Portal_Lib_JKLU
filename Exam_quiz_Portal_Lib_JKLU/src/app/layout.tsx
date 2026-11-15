import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF9F6',
};

export const metadata: Metadata = {
  title: 'Learn JKLU — Past Question Paper Archive',
  description:
    'Official academic resource portal for JK Lakshmipat University students. Browse, preview, and download past Mid-Term and End-Term question papers across B.Tech, BBA, and BCA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0] antialiased">
        {children}
      </body>
    </html>
  );
}

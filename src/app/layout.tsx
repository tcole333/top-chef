import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthLayout from '@/components/layout/AuthLayout';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Top Chef Fantasy League',
  description: 'Fantasy league for Top Chef enthusiasts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthLayout>
          {children}
        </AuthLayout>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
} 
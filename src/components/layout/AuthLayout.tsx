'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import LoginButton from '@/components/auth/LoginButton';
import Navigation from '@/components/layout/Navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('AuthLayout mounted');
  }, []);

  return (
    <AuthProvider>
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Top Chef Fantasy League</h1>
          <div className="border border-white p-2">
            <p className="text-white mb-2 bg-gray-900 p-1 rounded">Login Button Should Appear Below:</p>
            <LoginButton />
          </div>
        </div>
      </header>
      <Navigation />
      <main className="container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} Top Chef Fantasy League</p>
        </div>
      </footer>
    </AuthProvider>
  );
} 
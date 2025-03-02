'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Chefs', path: '/chefs' },
    { name: 'Scoreboard', path: '/scoreboard' },
    { name: 'Rules', path: '/rules' },
  ];

  if (user) {
    navItems.push(
      { name: 'Team', path: '/team' },
      { name: 'Fantasy Team', path: '/fantasy-team' },
      { name: 'Profile', path: '/profile' }
    );
    
    // Add admin link for all users (in a real app, you'd check for admin role)
    navItems.push({ name: 'Admin', path: '/admin' });
  }

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-4 overflow-x-auto py-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.path
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
} 
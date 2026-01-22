'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/diary', label: 'Food Diary', icon: '📔' },
  { href: '/recipes', label: 'Recipes', icon: '👩‍🍳' },
  { href: '/restaurants', label: 'Restaurants', icon: '🍽️' },
  { href: '/guide', label: 'Gluten Guide', icon: '📚' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b border-amber-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-amber-700">
            CeliApp
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

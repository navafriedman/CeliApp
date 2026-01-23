'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠', color: 'from-violet-400 to-purple-400' },
  { href: '/diary', label: 'Diary', icon: '📔', color: 'from-teal-400 to-emerald-400' },
  { href: '/recipes', label: 'Recipes', icon: '👩‍🍳', color: 'from-pink-400 to-rose-400' },
  { href: '/restaurants', label: 'Restaurants', icon: '🍽️', color: 'from-violet-400 to-purple-400' },
  { href: '/guide', label: 'Guide', icon: '📚', color: 'from-amber-400 to-orange-400' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-gray-200/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-xl group-hover:scale-110 transition-transform">✨</span>
            <span className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-poppins)' }}>
              CeliApp
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <span className={`mr-1.5 inline-block ${!isActive ? 'group-hover:scale-110 transition-transform' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>

                  {/* Active indicator dot for mobile */}
                  {isActive && (
                    <span className="sm:hidden absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Auth */}
            <div className="ml-2 pl-2 border-l border-gray-200">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

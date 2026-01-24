'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-gray-200/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/celia-logo.svg"
              alt="Celia"
              width={36}
              height={36}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-poppins)' }}>
              CeliApp
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
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
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Auth - Desktop */}
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

          {/* Mobile: Auth + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
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

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100/80 transition-all"
            >
              {mobileMenuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

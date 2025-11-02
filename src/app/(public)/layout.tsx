/**
 * Public Layout
 * Wraps all public-facing pages
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, LayoutGrid, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t, Locale, getDirection } from '@/lib/i18n';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const pathname = usePathname();
  const dir = getDirection(locale);

  const navigation = [
    { name: t('nav.home', locale), href: '/', icon: Home },
    { name: t('nav.kb', locale), href: '/kb', icon: BookOpen },
    { name: t('nav.catalog', locale), href: '/catalog', icon: LayoutGrid },
    { name: t('nav.chat', locale), href: '/chat', icon: MessageCircle },
  ];

  return (
    <html lang={locale} dir={dir}>
      <body className={cn('min-h-screen bg-background', dir === 'rtl' && 'font-arabic')}>
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold">ReOps AI</span>
                </Link>
                <nav className="hidden md:flex items-center space-x-6">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                  aria-label={t('nav.language', locale)}
                >
                  {locale === 'en' ? 'العربية' : 'English'}
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t bg-muted/40">
            <div className="container py-8">
              <p className="text-center text-sm text-muted-foreground">
                © 2025 ReOps AI. {t('common.viewAll', locale)}
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

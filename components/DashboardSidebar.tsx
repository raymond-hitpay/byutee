'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scissors, Calendar, CreditCard, Settings, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  orgName: string;
  orgSlug: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/services', label: 'Services', icon: Scissors },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/settings/payments', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar({ orgName, orgSlug }: DashboardSidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Organization</p>
        <p className="font-semibold text-white mt-1 truncate">{orgName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        {orgSlug && (
          <Link
            href={`/book/${orgSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview Booking Page
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

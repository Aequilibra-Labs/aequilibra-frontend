'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  User,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  Wallet,
  TrendingUp
} from 'lucide-react';

const menuItems = [
  {
    href: '/app/profile',
    icon: User,
    label: 'Profile',
    description: 'Manage your account'
  },
  {
    href: '/app/portfolio',
    icon: Wallet,
    label: 'Portfolio',
    description: 'View your positions'
  },
  {
    href: '/app/funding-comparison',
    icon: TrendingUp,
    label: 'Markets',
    description: 'Funding rates'
  },
  {
    href: '/app/settings',
    icon: Settings,
    label: 'Settings',
    description: 'App preferences'
  },
  {
    href: '/docs',
    icon: FileText,
    label: 'Documentation',
    description: 'Help & guides'
  },
  {
    href: '/legal',
    icon: Shield,
    label: 'Legal',
    description: 'Terms & privacy'
  }
];

export function SideMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Menu Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="md:hidden min-h-[44px] min-w-[44px]"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] bg-background border-r border-border shadow-xl md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">Aequilibra</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg transition-all duration-200 min-h-[44px]',
                        'hover:bg-muted/50 active:scale-[0.98]',
                        isActive 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium text-sm',
                          isActive ? 'text-primary' : 'text-foreground'
                        )}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={closeMenu}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
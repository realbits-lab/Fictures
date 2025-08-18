'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { ChevronDown, LogIn, User, Settings, LogOut, Sun, Moon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoaderIcon } from '@/components/icons';

export function GlobalNavigationBar() {
  const { data: session, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Fictures</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/read" className="text-sm font-medium transition-colors hover:text-primary">
            Read
          </Link>
          <Link href="/books" className="text-sm font-medium transition-colors hover:text-primary">
            Books
          </Link>
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="size-8 px-0"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Authentication */}
          {status === 'loading' ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin">
                <LoaderIcon size={16} />
              </div>
              <span className="text-sm">Loading...</span>
            </div>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-8">
                  <Image
                    src={session.user.image || `https://avatar.vercel.sh/${session.user.email}`}
                    alt={session.user.email ?? 'User Avatar'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="hidden sm:inline-block text-sm font-medium">
                    {session.user.name || session.user.email}
                  </span>
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut({ redirectTo: '/' })}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => signIn('google')}
              className="flex items-center space-x-2"
            >
              <LogIn className="size-4" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
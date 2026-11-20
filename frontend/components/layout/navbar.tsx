'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  BookOpen,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, UserRole } from '@/store/auth';
import { LoginDialog } from '@/components/auth/login-dialog';
import { RegisterDialog } from '@/components/auth/register-dialog';

export function Navbar() {
  const { user, isInitialized, logout } = useAuthStore();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const getInitials = () => {
    if (!user) return 'U';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const isInstructor = user?.roles?.includes('INSTRUCTOR' as UserRole);
  const isAdmin = user?.roles?.includes('ADMIN' as UserRole);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                LMS Platform
              </span>
            </Link>

            {/* Quick Explore Link */}
            <Link
              href="/courses"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore Courses</span>
            </Link>
          </div>

          {/* Search bar placeholder */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses, skills, and topics..."
                className="w-full pl-9 bg-muted/40 h-9"
              />
            </div>
          </div>

          {/* User Auth Action Center */}
          <div className="flex items-center gap-3">
            {!isInitialized ? (
              // Hydration-safe placeholder skeleton while initial silent refresh is running
              <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              // Authenticated User State
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative flex items-center gap-2.5 h-10 px-2 rounded-full focus-visible:ring-1"
                  >
                    <Avatar className="h-8 w-8">
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block text-sm font-medium text-foreground max-w-[120px] truncate">
                      {user.firstName || user.email.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {user.roles?.map((role) => (
                          <Badge
                            key={role}
                            variant={role === 'ADMIN' ? 'destructive' : 'secondary'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/student" className="cursor-pointer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>My Learning</span>
                      </Link>
                    </DropdownMenuItem>

                    {isInstructor && (
                      <DropdownMenuItem asChild>
                        <Link href="/instructor/courses" className="cursor-pointer">
                          <Briefcase className="mr-2 h-4 w-4" />
                          <span>Instructor Portal</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/categories" className="cursor-pointer text-destructive focus:text-destructive">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          <span>Admin Console</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/student" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Guest Visitor State
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLoginOpen(true)}
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={() => setRegisterOpen(true)}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modals */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => setRegisterOpen(true)}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => setLoginOpen(true)}
      />
    </>
  );
}

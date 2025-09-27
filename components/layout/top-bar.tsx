"use client"
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth/session';
import { 
  Search, 
  Menu, 
  Bell, 
  Settings,
  Zap,
  TrendingUp,
  Calendar,
  Mail,
  LogOut,
  User
} from 'lucide-react';

interface TopBarProps {
  className?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  emailStats?: {
    total: number;
    unread: number;
    important: number;
  };
  onMenuClick?: () => void;
  onSearchChange?: (query: string) => void;
}

export function TopBar({ 
  className, 
  user, 
  emailStats = { total: 0, unread: 0, important: 0 },
  onMenuClick,
  onSearchChange 
}: TopBarProps) {
  const { logout } = useSession();

  return (
    <header className={cn('flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200', className)}>
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Mail className="w-6 h-6 text-black" />
          <h1 className="text-xl font-semibold text-gray-900">MailMind</h1>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emails..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Today's Email Summary */}
        <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">Today:</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{emailStats.total}</span>
              <span className="text-xs text-gray-500">total</span>
            </div>
            {emailStats.unread > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-600">{emailStats.unread}</span>
                <span className="text-xs text-gray-500">unread</span>
              </div>
            )}
            {emailStats.important > 0 && (
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">{emailStats.important}</span>
                <span className="text-xs text-gray-500">important</span>
              </div>
            )}
          </div>
        </div>

        {/* Important Emails Alert */}
        {emailStats.important > 0 && (
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Zap className="w-5 h-5 text-orange-600" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-orange-600 text-white text-xs"
              >
                {emailStats.important}
              </Badge>
            </Button>
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="hidden sm:relative">
          <Bell className="w-5 h-5" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Avatar with Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image} alt={user.name || 'User'} />
                  <AvatarFallback>
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
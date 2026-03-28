
'use client';

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Menu, User, Settings, LogOut, Bell, CheckCheck, Inbox } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from './language-selector';
import { apiClient } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          href={props.href || ''}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Compute role-specific dashboard URL directly — avoids redirect page
  const dashboardHref = (() => {
    if (!user) return '/dashboard';
    const role = user.role.toLowerCase();
    if (role === 'admin' || role === 'super_admin') return '/dashboard/admin';
    if (role === 'exporter') return '/dashboard/exporter';
    if (role === 'partner') return '/dashboard/partner';
    return '/dashboard/buyer';
  })();
  const [hasGoogleTranslate, setHasGoogleTranslate] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Detect Google Translate bar - only when actually translating
  useEffect(() => {
    const checkGoogleTranslate = () => {
      // Check if the translate banner frame is visible
      const bannerFrame = document.querySelector('.goog-te-banner-frame') as HTMLElement;
      const isBannerVisible = bannerFrame && bannerFrame.style.display !== 'none' && bannerFrame.offsetHeight > 0;
      
      // Check if body has top margin/padding from Google Translate
      const bodyTop = document.body.style.top;
      const hasBodyOffset = bodyTop && bodyTop !== '0px' && bodyTop !== '';
      
      // Only set true if banner is actually visible or body has offset
      setHasGoogleTranslate(!!(isBannerVisible || hasBodyOffset));
    };

    // Check immediately
    checkGoogleTranslate();

    // Check periodically for changes (less frequent to save resources)
    const interval = setInterval(checkGoogleTranslate, 1000);

    // Observer for DOM changes
    const observer = new MutationObserver(checkGoogleTranslate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      // Poll for new notifications every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await apiClient.getNotifications();
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      // Silently fail for notifications - they're optional
      // Network errors and auth errors are already suppressed in apiClient
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !notifications) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) {
      toast({ title: "No unread notifications." });
      return;
    }

    try {
      await apiClient.markAllNotificationsAsRead();
      await fetchNotifications();
      toast({
        title: 'Notifications Updated',
        description: 'All notifications have been marked as read.',
      });
    } catch (error) {

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update notifications.',
      });
    }
  };

  const handleNotificationClick = async (notification: { id: string; type: string; read: boolean }) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await apiClient.markNotificationAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // silently fail
      }
    }
    // Navigate based on type
    if (notification.type === 'CHAT_MESSAGE') {
      router.push('/dashboard/chat');
    } else {
      router.push('/dashboard/notifications');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Top Google-style bar to prevent translate widget from hiding navigation 
      <div className="top-header-bar w-full">
        <div className="container mx-auto flex items-center justify-between">
          <span>KEPROBA - Official Trade Directory for Certified Kenyan Exporters</span>
          <span className="hidden sm:inline">Connecting Kenya to the World</span>
        </div>
      </div>*/}
      
      <header className={`fixed top-0 left-0 right-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm transition-all duration-300`} style={{ top: hasGoogleTranslate ? '40px' : '0px' }}>
      <div className="container mx-auto flex h-24 md:h-28 lg:h-32 items-center px-4 justify-between">
        <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Logo size="large" isLight={true} />
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList className="flex items-center">
                <NavigationMenuItem>
                    <NavigationMenuLink href="/" className={navigationMenuTriggerStyle()}>
                        Home
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href="/about" className={navigationMenuTriggerStyle()}>
                        About
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href="/directory" className={navigationMenuTriggerStyle()}>
                        Directory
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink 
                      href="http://keproba-elms-staging-8888.161.97.178.128.sslip.io/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={navigationMenuTriggerStyle()}
                    >
                        eLearning
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink href="/contact" className={navigationMenuTriggerStyle()}>
                        Contact
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>    
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <div className="h-6 w-px bg-border"></div>
            {isAuthenticated && user ? (
              <>
                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="relative h-10 w-10 rounded-full hover:bg-accent/20"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96 mr-2 mt-2 p-0 z-[9999]" align="end" style={{ zIndex: 9999 }}>
                    <div className="flex items-center justify-between p-4 border-b">
                      <DropdownMenuLabel className="p-0 text-lg font-semibold">
                        Notifications
                      </DropdownMenuLabel>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={isLoadingNotifications || notifications.every(n => n.read)}
                        className="h-8 text-xs"
                      >
                        <CheckCheck className="mr-1 h-3 w-3" />
                        Mark all read
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px]">
                      {isLoadingNotifications ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          Loading notifications...
                        </div>
                      ) : notifications && notifications.length > 0 ? (
                        <div className="p-2">
                          {notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={cn(
                                "flex items-start gap-3 rounded-lg p-3 mb-2 transition-colors cursor-pointer hover:bg-accent/50",
                                notification.read ? "bg-muted/30" : "bg-background"
                              )}
                            >
                              <span className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full mt-1 flex-shrink-0",
                                notification.read ? "bg-muted-foreground/20" : "bg-primary/10 text-primary"
                              )}>
                                <Bell className="h-4 w-4" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <Inbox className="mx-auto h-12 w-12 mb-3 opacity-50" />
                          <p className="text-sm font-medium">No notifications</p>
                          <p className="text-xs mt-1">You're all caught up!</p>
                        </div>
                      )}
                    </ScrollArea>
                    {notifications && notifications.length > 0 && (
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          className="w-full text-sm"
                          asChild
                        >
                          <Link href="/dashboard/notifications">
                            View all notifications
                          </Link>
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-12 w-12 rounded-full p-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 transition-all duration-200"
                      style={{ minWidth: '88px', minHeight: '48px' }}
                    >
                      <Avatar className="h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-all duration-200" style={{ width: '48px', height: '48px' }}>
                        <AvatarImage 
                          src={(() => {
                            const imageUrl = user.profileImage || user.avatar;

                            return imageUrl;
                          })()} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="object-cover rounded-full"
                          style={{ width: '100%', height: '100%' }}
                          onError={() => {

                          }}
                          onLoad={() => {

                          }}
                        />
                        <AvatarFallback 
                          className="bg-green-600 text-white font-bold text-lg rounded-full uppercase flex items-center justify-center"
                          style={{ width: '100%', height: '100%', fontSize: '18px', lineHeight: '1' }}
                        >
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mr-2 mt-2 z-[9999]" align="end" forceMount style={{ zIndex: 9999 }}>
                    <DropdownMenuLabel className="font-normal bg-green-50 dark:bg-green-900/20 p-4 rounded-t-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 rounded-full shadow-md">
                          <AvatarImage 
                            src={(() => {
                              const imageUrl = user.profileImage || user.avatar;
                              return imageUrl;
                            })()} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="object-cover w-full h-full rounded-full"
                          />
                          <AvatarFallback className="bg-green-600 text-white font-bold text-lg rounded-full uppercase flex items-center justify-center w-full h-full">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs leading-none text-gray-600 dark:text-gray-400">{user.email}</p>
                          <p className="text-xs leading-none text-green-600 font-semibold uppercase tracking-wide">{user.role === 'PARTNER' && (user as any).partnerType ? ((user as any).partnerType.startsWith('Other: ') ? (user as any).partnerType.replace('Other: ', '') : (user as any).partnerType) : user.role}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-yellow-50 hover:text-green-800 transition-all duration-200 rounded-md">
                        <Link href={dashboardHref} className="flex items-center w-full">
                          <User className="mr-3 h-4 w-4" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-yellow-50 hover:text-green-800 transition-all duration-200 rounded-md">
                        <Link href="/dashboard/settings/profile" className="flex items-center w-full">
                          <Settings className="mr-3 h-4 w-4" />
                          <span className="font-medium">Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="cursor-pointer hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-md text-red-600"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-medium">Logout</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Not logged in - show login/register buttons
              <>
                <Button variant="ghost" asChild className="bg-white dark:bg-transparent text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 hover:bg-yellow-400 hover:text-green-800 hover:border-yellow-400 transition-all">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4"/> Login
                  </Link>
                </Button>
                <Button variant="default" asChild className="bg-green-600 text-white hover:bg-yellow-400 hover:text-green-800 transition-all">
                  <Link href="/register">
                     <UserPlus className="mr-2 h-4 w-4"/> Register
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

         <div className="flex md:hidden items-center justify-end flex-1">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-accent/20">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="py-6 flex flex-col justify-between h-[calc(100%-80px)]">
                <nav className="flex flex-col gap-2 text-lg font-medium">
                  <Link 
                    href="/" 
                    className="px-4 py-3 rounded-lg hover:bg-accent/20 hover:text-accent transition-colors" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/about" 
                    className="px-4 py-3 rounded-lg hover:bg-accent/20 hover:text-accent transition-colors" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link 
                    href="/directory" 
                    className="px-4 py-3 rounded-lg hover:bg-accent/20 hover:text-accent transition-colors" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Directory
                  </Link>
                  <a 
                    href="http://keproba-elms-staging-8888.161.97.178.128.sslip.io/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-lg hover:bg-accent/20 hover:text-accent transition-colors" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    LMS
                  </a>
                  <Link 
                    href="/contact" 
                    className="px-4 py-3 rounded-lg hover:bg-accent/20 hover:text-accent transition-colors" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </nav>
                <div className="space-y-4 border-t pt-6 mt-auto">
                  <LanguageSelector />
                  {isAuthenticated && user ? (
                    // Logged in user mobile menu
                    <>
                      <div className="px-4 py-3 border-b bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 rounded-full shadow-sm">
                            <AvatarImage 
                              src={user.profileImage || user.avatar} 
                              alt={`${user.firstName} ${user.lastName}`}
                              className="object-cover w-full h-full rounded-full"
                            />
                            <AvatarFallback className="bg-green-600 text-white font-bold text-lg rounded-full uppercase flex items-center justify-center w-full h-full">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">{user.role === 'PARTNER' && (user as any).partnerType ? ((user as any).partnerType.startsWith('Other: ') ? (user as any).partnerType.replace('Other: ', '') : (user as any).partnerType) : user.role}</p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        asChild 
                        className="w-full justify-start text-base hover:bg-yellow-50 hover:text-green-800 transition-colors"
                      >
                        <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                          <User className="mr-3 h-5 w-5" /> Dashboard
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        asChild 
                        className="w-full justify-start text-base hover:bg-yellow-50 hover:text-green-800 transition-colors"
                      >
                        <Link href="/dashboard/settings/profile" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="mr-3 h-5 w-5" /> Profile
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }} 
                        className="w-full justify-start text-base text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                      >
                        <LogOut className="mr-3 h-5 w-5" /> Logout
                      </Button>
                    </>
                  ) : (
                    // Not logged in mobile menu
                    <>
                      <Button 
                        variant="ghost" 
                        asChild 
                        className="w-full justify-start text-base bg-white dark:bg-transparent text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 hover:bg-yellow-400 hover:text-green-800 hover:border-yellow-400 transition-colors"
                      >
                        <Link href="/login">
                          <LogIn className="mr-2 h-5 w-5" /> Login
                        </Link>
                      </Button>
                      <Button 
                        variant="default" 
                        asChild 
                        className="w-full justify-start text-base bg-green-600 text-white hover:bg-yellow-400 hover:text-green-800 transition-colors"
                      >
                        <Link href="/register">
                          <UserPlus className="mr-2 h-5 w-5" /> Register
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    </>
  );
}

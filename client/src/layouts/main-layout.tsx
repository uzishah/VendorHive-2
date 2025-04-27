import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Settings, FileText, Calendar } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Browse Services', path: '/services' },
    { name: 'Browse Vendors', path: '/vendors' },
    { name: 'Bookings', path: '/bookings' },
    { name: 'Contact', path: '/contact' },
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <Logo />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link key={item.name} href={item.path}>
                    <div className={`${
                      location === item.path 
                        ? 'border-primary text-secondary-dark' 
                        : 'border-transparent text-secondary-light hover:border-gray-300 hover:text-secondary-dark'
                      } border-b-2 px-1 pt-1 text-sm font-medium cursor-pointer`}>
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImage} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'vendor' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Dashboard</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/vendor-services">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Manage Services</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/bookings">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>Bookings</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <div className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex space-x-4">
                  <Link href="/auth?tab=login">
                    <Button variant="outline" className="text-primary hover:bg-primary hover:text-white">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth?tab=register">
                    <Button className="bg-primary hover:bg-primary-dark text-white">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center sm:hidden">
              <button 
                type="button" 
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.path}>
                <div 
                  className={`${
                    location === item.path
                      ? 'bg-gray-50 border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link href="/profile">
                  <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </div>
                </Link>
                {user?.role === 'vendor' && (
                  <>
                    <Link href="/dashboard">
                      <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                        Dashboard
                      </div>
                    </Link>
                    <Link href="/vendor-services">
                      <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                        Manage Services
                      </div>
                    </Link>
                    <Link href="/bookings">
                      <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                        Bookings
                      </div>
                    </Link>
                  </>
                )}
                <Link href="/settings">
                  <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Settings
                  </div>
                </Link>
                <button 
                  className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link href="/auth?tab=login">
                  <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Log in
                  </div>
                </Link>
                <Link href="/auth?tab=register">
                  <div className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign up
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <Link href="/about">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  About
                </div>
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/services">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  Services
                </div>
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/pricing">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  Pricing
                </div>
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/vendors">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  Vendors
                </div>
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/contact">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  Contact
                </div>
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/terms">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  Terms
                </div>
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/privacy">
                <div className="text-base text-gray-500 hover:text-gray-900 cursor-pointer">
                  Privacy
                </div>
              </Link>
            </div>
          </nav>
          <div className="mt-8 flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Facebook</span>
              <i className="fab fa-facebook text-xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Instagram</span>
              <i className="fab fa-instagram text-xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <i className="fab fa-twitter text-xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">LinkedIn</span>
              <i className="fab fa-linkedin text-xl"></i>
            </a>
          </div>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} VendorHive. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

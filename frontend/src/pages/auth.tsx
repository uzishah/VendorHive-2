import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
const registerUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }).regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  userType: z.enum(['user', 'vendor']),
  terms: z.boolean().refine((val) => val === true, { message: 'You must accept the terms and conditions' }),
});

// Vendor registration schema
const vendorSchema = z.object({
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
  category: z.string().min(2, { message: 'Category is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
});

// Combine schemas with validation for matching passwords
const registerSchema = registerUserSchema.refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const AuthPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/auth');
  const { login, register: registerUser, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isVendor, setIsVendor] = useState<boolean>(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  
  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ['login', 'register'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // Redirect if already authenticated when page loads
  useEffect(() => {
    // Only redirect on initial load, not after successful login/registration
    if (isAuthenticated && !isLoading) {
      // Get the registered time from storage to prevent immediate redirect after registration
      const registeredTime = localStorage.getItem('registeredAt');
      const currentTime = new Date().getTime();
      
      // If there's no registration timestamp or it's been more than 2 seconds since registration
      // This prevents redirection right after registration
      if (!registeredTime || (currentTime - parseInt(registeredTime)) > 2000) {
        // For existing sessions, redirect users based on their role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.role === 'vendor') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    }
  }, [isAuthenticated, navigate, isLoading]);
  
  // Login form setup
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  // Register form setup with conditional vendor fields
  const registerForm = useForm<z.infer<typeof registerSchema> & { vendor?: z.infer<typeof vendorSchema> }>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'user',
      terms: false,
      vendor: {
        businessName: '',
        category: '',
        description: '',
      },
    },
  });
  
  // Watch for user type change to show/hide vendor fields
  const userType = registerForm.watch('userType');
  useEffect(() => {
    setIsVendor(userType === 'vendor');
  }, [userType]);
  
  // Handle login form submission
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    await login(values.email, values.password);
  };
  
  // Handle register form submission
  const onRegisterSubmit = async (values: z.infer<typeof registerSchema> & { vendor?: z.infer<typeof vendorSchema> }) => {
    const { terms, confirmPassword, userType, ...userData } = values;
    
    // Explicitly set role based on userType
    // CRITICAL FIX: Ensure role property is correctly set to 'vendor' when userType is 'vendor'
    const isVendorRegistration = userType === 'vendor';
    const userDataWithRole = {
      ...userData,
      role: isVendorRegistration ? 'vendor' : 'user' // Ensure we explicitly set 'vendor' for vendor registrations
    };
    
    console.log('Vendor Registration Debug:', { 
      userType,
      isVendorRegistration,
      role: userDataWithRole.role,
      vendorDataPresent: !!values.vendor
    });
    
    // If registering as vendor, include vendor data
    if (isVendorRegistration) {
      try {
        console.log('Submitting vendor registration with role:', userDataWithRole.role);
        
        // Create default vendor data if not provided
        const vendorData = values.vendor || {
          businessName: userData.name + "'s Business",
          category: "General Services",
          description: "A new vendor on VendorHive"
        };
        
        // Always pass isVendor=true to ensure proper handling
        await registerUser(userDataWithRole, true, vendorData);
      } catch (error) {
        console.error("Vendor registration error:", error);
      }
    } else {
      await registerUser(userDataWithRole, false);
    }
  };
  
  return (
    <MainLayout>
      <section className="py-12 bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="md:flex">
            <div className="p-8 w-full">
              <div className="uppercase tracking-wide text-sm text-primary font-semibold mb-6 text-center">Account Access</div>
              
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your.email@example.com" 
                                autoComplete="email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                autoComplete="current-password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center justify-between">
                        <FormField
                          control={loginForm.control}
                          name="rememberMe"
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="remember-me" 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                              <label 
                                htmlFor="remember-me" 
                                className="text-sm text-gray-900"
                              >
                                Remember me
                              </label>
                            </div>
                          )}
                        />
                        
                        <div className="text-sm">
                          <a 
                            href="#" 
                            className="font-medium text-primary hover:text-primary-dark"
                          >
                            Forgot your password?
                          </a>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                      <FormField
                        control={registerForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am a:</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select user type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">Customer</SelectItem>
                                <SelectItem value="vendor">Vendor / Service Provider</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="John Doe" 
                                autoComplete="name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="johndoe" 
                                autoComplete="username" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your.email@example.com" 
                                autoComplete="email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                autoComplete="new-password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                autoComplete="new-password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isVendor && (
                        <>
                          <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Vendor Information</h3>
                          </div>
                          
                          <FormField
                            control={registerForm.control}
                            name="vendor.businessName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="text" 
                                    placeholder="Your Business Name" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="vendor.category"
                            render={({ field }) => {
                              const [isCustomCategory, setIsCustomCategory] = useState(false);
                              return (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  {!isCustomCategory ? (
                                    <>
                                      <Select 
                                        onValueChange={(value) => {
                                          if (value === "custom") {
                                            setIsCustomCategory(true);
                                          } else {
                                            field.onChange(value);
                                          }
                                        }} 
                                        defaultValue={field.value}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Event Planning">Event Planning</SelectItem>
                                          <SelectItem value="Home Services">Home Services</SelectItem>
                                          <SelectItem value="IT Services">IT Services</SelectItem>
                                          <SelectItem value="Food & Catering">Food & Catering</SelectItem>
                                          <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                                          <SelectItem value="Education & Training">Education & Training</SelectItem>
                                          <SelectItem value="Photography">Photography</SelectItem>
                                          <SelectItem value="custom">Enter Custom Category</SelectItem>
                                          <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Select from our categories or choose "Enter Custom Category" to add your own
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        <FormControl>
                                          <Input 
                                            placeholder="Enter your category" 
                                            value={field.value} 
                                            onChange={field.onChange}
                                            className="flex-1"
                                          />
                                        </FormControl>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setIsCustomCategory(false)}
                                        >
                                          Back to List
                                        </Button>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Enter your custom business category
                                      </div>
                                    </>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="vendor.description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Description</FormLabel>
                                <FormControl>
                                  <textarea 
                                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Describe your business and services..." 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      <FormField
                        control={registerForm.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to the{" "}
                                <a href="#" className="text-primary hover:text-primary-dark">
                                  Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-primary hover:text-primary-dark">
                                  Privacy Policy
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AuthPage;

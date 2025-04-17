import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  getVendorByUserId, 
  getVendorServices, 
  getVendorBookings, 
  createService, 
  updateBookingStatus, 
  updateVendor, 
  getVendorReviews
} from '@/services/api';
import { 
  BarChart4, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  PlusCircle, 
  Settings, 
  Users, 
  CheckCircle,
  XCircle
} from 'lucide-react';

// Service form schema
const serviceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(2, "Category is required"),
  duration: z.string().optional(),
  availability: z.boolean().default(true),
});

// Vendor profile update schema
const vendorUpdateSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, vendorProfile, updateVendorProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  
  // CRITICAL FIX: Move all hook calls before the conditional return
  // to maintain consistent hook ordering (React Hooks rule)
  const { data: vendorData } = useQuery({
    queryKey: ['/api/vendors/user', user?.id],
    queryFn: () => user?.id ? getVendorByUserId(user.id) : null,
    enabled: !!user && user.role === 'vendor',
  });
  
  // Using vendorProfile from context or fetched data
  const vendor = vendorProfile || vendorData;
  const vendorId = vendor?.id;

  // Redirect if not authenticated or not a vendor
  if (!isAuthenticated || !user || user.role !== 'vendor') {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <Card>
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Vendor Access Required</h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in as a vendor to access the dashboard.
              </p>
              <Button className="mr-4" asChild>
                <a href="/auth?tab=login">Log In</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/auth?tab=register">Register as Vendor</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Fetch services, bookings, and reviews
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'services'],
    queryFn: () => getVendorServices(vendorId!),
    enabled: !!vendorId,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/vendor'],
    queryFn: getVendorBookings,
    enabled: !!vendorId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'reviews'],
    queryFn: () => getVendorReviews(vendorId!),
    enabled: !!vendorId,
  });

  // Service form
  const serviceForm = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      duration: '',
      availability: true,
    },
  });

  // Vendor profile form
  const vendorProfileForm = useForm<z.infer<typeof vendorUpdateSchema>>({
    resolver: zodResolver(vendorUpdateSchema),
    defaultValues: {
      businessName: vendor?.businessName || '',
      category: vendor?.category || '',
      description: vendor?.description || '',
    },
  });

  // Update form values when vendor data changes
  React.useEffect(() => {
    if (vendor) {
      vendorProfileForm.reset({
        businessName: vendor.businessName,
        category: vendor.category,
        description: vendor.description,
      });
    }
  }, [vendor, vendorProfileForm]);

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: (serviceData: z.infer<typeof serviceSchema>) => {
      return createService({
        ...serviceData,
        vendorId: vendorId!,
      });
    },
    onSuccess: () => {
      toast({
        title: "Service created",
        description: "Your service has been added successfully",
      });
      setIsAddServiceModalOpen(false);
      serviceForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId, 'services'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create service",
        description: error instanceof Error ? error.message : "An error occurred while creating the service",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => {
      toast({
        title: "Booking updated",
        description: "Booking status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/vendor'] });
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Handle service form submission
  const handleAddService = (values: z.infer<typeof serviceSchema>) => {
    createServiceMutation.mutate(values);
  };

  // Handle vendor profile update
  const handleUpdateVendorProfile = async (values: z.infer<typeof vendorUpdateSchema>) => {
    try {
      await updateVendorProfile(values);
      setIsEditProfileModalOpen(false);
      toast({
        title: "Profile updated",
        description: "Your vendor profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update vendor profile",
        variant: "destructive",
      });
    }
  };

  // Calculate some stats
  const pendingBookings = bookings?.filter(b => b.status === 'pending')?.length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed')?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'completed')?.length || 0;
  const totalServices = services?.length || 0;
  const totalReviews = reviews?.length || 0;
  const avgRating = reviews?.length 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-dark">Vendor Dashboard</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setIsEditProfileModalOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button onClick={() => setIsAddServiceModalOpen(true)} size="lg" className="bg-primary hover:bg-primary-dark">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Service
            </Button>
          </div>
        </div>
        
        {/* Call-to-action banner for creating services */}
        {(!services || services.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Start offering services to your customers</h2>
            <p className="text-blue-600 mb-4">Add your services to start accepting bookings from customers</p>
            <Button 
              onClick={() => setIsAddServiceModalOpen(true)} 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Your First Service
            </Button>
          </div>
        )}
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Pending Bookings</p>
                  <h3 className="text-2xl font-bold">{pendingBookings}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Confirmed Bookings</p>
                  <h3 className="text-2xl font-bold">{confirmedBookings}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Services</p>
                  <h3 className="text-2xl font-bold">{totalServices}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart4 className="h-6 w-6 text-yellow-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Average Rating</p>
                  <h3 className="text-2xl font-bold">{avgRating}/5.0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="h-6 w-6 text-red-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Reviews</p>
                  <h3 className="text-2xl font-bold">{totalReviews}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-indigo-700" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Completed Jobs</p>
                  <h3 className="text-2xl font-bold">{completedBookings}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Action Panel and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access frequently used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setIsAddServiceModalOpen(true)} className="w-full justify-start">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Service
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/bookings">
                  <Calendar className="mr-2 h-5 w-5" />
                  View All Bookings
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsEditProfileModalOpen(true)}>
                <Settings className="mr-2 h-5 w-5" />
                Update Business Profile
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`/vendors/${vendorId}`} target="_blank" rel="noopener noreferrer">
                  <Users className="mr-2 h-5 w-5" />
                  View Public Profile
                </a>
              </Button>
            </CardContent>
          </Card>
          
          {/* Analytics Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Bookings and ratings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col justify-center items-center">
                {/* In a real app, this would be a chart from Recharts */}
                <div className="text-center">
                  <div className="flex justify-center items-end h-[200px] space-x-2 mb-4">
                    {[0.3, 0.5, 0.7, 0.4, 0.9, 0.6, 0.8].map((height, i) => (
                      <div 
                        key={i} 
                        className="w-8 bg-gradient-to-t from-primary/50 to-primary rounded-t-md"
                        style={{height: `${height * 100}%`}}
                      ></div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Last 7 days activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content tabs */}
        <Tabs defaultValue="bookings">
          <TabsList className="mb-6">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Manage Bookings</CardTitle>
                <CardDescription>
                  View and manage your customer bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="animate-pulse p-4 border rounded-md">
                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="flex justify-end">
                          <div className="h-8 bg-gray-200 rounded w-24 mr-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any bookings yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                Booking #{booking.id}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(booking.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              {booking.notes && (
                                <p className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {booking.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                                ${booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                                ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                              `}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          {booking.status === 'pending' && (
                            <div className="mt-4 flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => updateBookingStatusMutation.mutate({ 
                                  id: booking.id, 
                                  status: 'confirmed' 
                                })}
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => updateBookingStatusMutation.mutate({ 
                                  id: booking.id, 
                                  status: 'cancelled' 
                                })}
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                          
                          {booking.status === 'confirmed' && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => updateBookingStatusMutation.mutate({ 
                                  id: booking.id, 
                                  status: 'completed' 
                                })}
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                Mark as Completed
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Services</CardTitle>
                  <CardDescription>
                    Manage your services and offerings
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsAddServiceModalOpen(true)} 
                  className="bg-primary hover:bg-primary-dark"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Service
                </Button>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="animate-pulse p-4 border rounded-md">
                        <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    ))}
                  </div>
                ) : !services || services.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't added any services yet.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setIsAddServiceModalOpen(true)}>
                        Add a Service
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <div className="flex items-center mt-1 mb-2">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500">
                              {service.duration || 'Duration not specified'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-primary">{service.price}</p>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 mr-2">Available</span>
                              <Switch checked={service.availability} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Card className="border-dashed border-2 hover:border-primary/50 cursor-pointer"
                         onClick={() => setIsAddServiceModalOpen(true)}>
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[180px]">
                        <PlusCircle className="h-12 w-12 text-gray-300" />
                        <p className="mt-4 text-gray-500 font-medium">Add New Service</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>
                  See what your customers are saying about your services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mt-1"></div>
                      </div>
                    ))}
                  </div>
                ) : !reviews || reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't received any customer reviews yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                {review.user.name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <h4 className="font-semibold">{review.user.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  <i className="fas fa-star"></i>
                                </span>
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-4 text-gray-700">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Add Service Modal */}
        <Dialog open={isAddServiceModalOpen} onOpenChange={setIsAddServiceModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service for your customers to book.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...serviceForm}>
              <form onSubmit={serviceForm.handleSubmit(handleAddService)} className="space-y-4">
                <FormField
                  control={serviceForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Basic Consultation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={serviceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe what this service includes" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={serviceForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g. Consulting, Photography, Design" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={serviceForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. $99.99" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 1 hour" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={serviceForm.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Available for Booking</FormLabel>
                        <FormDescription>
                          Make this service available for customers to book
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createServiceMutation.isPending}>
                    {createServiceMutation.isPending ? "Creating..." : "Create Service"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Vendor Profile Modal */}
        <Dialog open={isEditProfileModalOpen} onOpenChange={setIsEditProfileModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Vendor Profile</DialogTitle>
              <DialogDescription>
                Update your business information and details.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...vendorProfileForm}>
              <form onSubmit={vendorProfileForm.handleSubmit(handleUpdateVendorProfile)} className="space-y-4">
                <FormField
                  control={vendorProfileForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={vendorProfileForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={vendorProfileForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your business and services" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;

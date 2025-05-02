import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StarRating from '@/components/ui/star-rating';
import { getVendorById, getVendorServices, createBooking, createReview } from '@/services/api';
import { MapPin, Phone, Mail, FileText, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface Vendor {
  id: number;
  userId: number | string;
  businessName: string;
  category: string;
  description: string;
  businessHours?: Record<string, any>;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  user: {
    id: number | string;
    name: string;
    email: string;
    username: string;
    location?: string;
    phone?: string;
    profileImage?: string;
  };
  services: any[];
  reviews: any[];
}

const bookingSchema = z.object({
  date: z.date({ required_error: "Please select a date for your booking" }),
  notes: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters long"),
});

const VendorProfilePage: React.FC = () => {
  const [, params] = useRoute<{ id: string }>('/vendors/:id');
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get query parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const serviceIdParam = searchParams.get('serviceId');
  const bookParam = searchParams.get('book');
  
  // Initialize state with URL parameters if available
  const initialServiceId = serviceIdParam ? parseInt(serviceIdParam) : undefined;
  const shouldOpenBookingModal = bookParam === 'true' && initialServiceId !== undefined;

  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(initialServiceId);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(shouldOpenBookingModal);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const vendorId = params?.id ? parseInt(params.id) : 0;

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ['/api/vendors', vendorId],
    queryFn: async () => {
      console.log(`Fetching vendor with ID: ${vendorId}`);
      const data = await getVendorById(vendorId);
      console.log("Vendor profile loaded successfully:", data);
      console.log("Services in response:", data.services);
      return data as Vendor;
    },
    enabled: !!vendorId,
  });
  
  // Fetch vendor services separately to ensure we always have the latest data
  const { data: vendorServices = [] } = useQuery({
    queryKey: ['/api/vendors', vendorId, 'services'],
    queryFn: async () => {
      console.log(`Fetching services for vendor ID: ${vendorId}`);
      const services = await getVendorServices(vendorId);
      console.log("Services fetched separately:", services);
      return services;
    },
    enabled: !!vendorId,
  });

  // Booking form setup
  const bookingForm = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: new Date(),
      notes: '',
    },
  });

  // Review form setup
  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: '',
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (response) => {
      toast({
        title: "Booking successful",
        description: "Your booking has been created successfully",
      });
      setIsBookingModalOpen(false);
      bookingForm.reset();
      
      // Redirect to payment page with the booking ID
      if (response && response.id) {
        window.location.href = `/payment?bookingId=${response.id}`;
      }
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });
      setIsReviewModalOpen(false);
      reviewForm.reset();
      // Invalidate vendor data to refresh reviews
      queryClient.invalidateQueries({ queryKey: ['/api/vendors', vendorId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error instanceof Error ? error.message : "An error occurred while submitting your review",
        variant: "destructive",
      });
    },
  });

  const handleBookingSubmit = (values: z.infer<typeof bookingSchema>) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book this service",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate({
      userId: user.id,
      vendorId: vendorId,
      serviceId: selectedServiceId,
      date: values.date.toISOString(),
      status: 'pending',
      notes: values.notes,
    });
  };

  const handleReviewSubmit = (values: z.infer<typeof reviewSchema>) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to leave a review",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      userId: user.id,
      vendorId: vendorId,
      rating: values.rating,
      comment: values.comment,
    });
  };

  if (vendorLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="md:flex md:space-x-6">
              <div className="md:w-1/3">
                <div className="h-64 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="md:w-2/3 mt-6 md:mt-0">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!vendor) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-gray-600">Vendor not found.</p>
          <Link href="/vendors">
            <Button className="mt-4">Browse All Vendors</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Vendor profile header */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="h-48 bg-gradient-to-r from-primary-light to-primary overflow-hidden">
            {vendor.coverImage ? (
              <img
                className="w-full h-full object-cover"
                src={vendor.coverImage}
                alt={vendor.businessName}
              />
            ) : (
              <img
                className="w-full h-full object-cover opacity-50"
                src={`https://source.unsplash.com/featured/?${encodeURIComponent(vendor.category)}`}
                alt={vendor.businessName}
              />
            )}
          </div>
          
          <div className="px-6 py-4 relative">
            <div className="absolute -top-16 left-6 bg-white rounded-full p-1 shadow-md">
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                {vendor.businessName.charAt(0)}
              </div>
            </div>
            
            <div className="ml-32">
              <h1 className="text-3xl font-bold text-secondary-dark">{vendor.businessName}</h1>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                  {vendor.category}
                </span>
                <StarRating rating={vendor.rating} showCount={true} count={vendor.reviewCount} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Vendor details and tabs */}
        <div className="md:flex md:space-x-8">
          {/* Sidebar with contact info */}
          <div className="md:w-1/3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Location</h4>
                    <p className="text-gray-600">{vendor.user.location || "Location not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p className="text-gray-600">{vendor.user.phone || "Phone not specified"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-gray-600">{vendor.user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Business Hours</h4>
                    <p className="text-gray-600">
                      {vendor.businessHours ? (
                        <span>Custom hours available</span>
                      ) : (
                        <span>9:00 AM - 5:00 PM (Default)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {isAuthenticated && user && user.id !== vendor.userId && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedServiceId(undefined);
                      setIsBookingModalOpen(true);
                    }}
                  >
                    Book Now
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          {/* Main content area with tabs */}
          <div className="md:w-2/3">
            <Tabs defaultValue="about">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle>About {vendor.businessName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-line">{vendor.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="services">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-secondary-dark">Services Offered</h3>
                  </div>
                  
                  {(() => {
                    console.log("Rendering services tab with:", vendor.services);
                    console.log("Separately fetched services:", vendorServices);
                    
                    // Combine both sources of services data with fallback
                    const displayServices = vendorServices.length > 0 ? 
                        vendorServices : 
                        (vendor.services && Array.isArray(vendor.services) ? vendor.services : []);
                    
                    console.log("Final services data for rendering:", displayServices);
                    
                    return displayServices.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayServices.map((service: any, index: number) => {
                          console.log(`Rendering service at index ${index}:`, service);
                          return (
                            <Card key={service.id} className="overflow-hidden">
                              {service.imageUrl && (
                                <div className="w-full h-48 overflow-hidden">
                                  <img 
                                    src={service.imageUrl} 
                                    alt={service.name}
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                              )}
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                <CardDescription>
                                  {service.duration && <span className="block text-sm">{service.duration}</span>}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                                <p className="font-semibold text-primary">{service.price}</p>
                                {service.location && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <MapPin className="inline h-3 w-3 mr-1" />
                                    {service.location}
                                  </p>
                                )}
                              </CardContent>
                              <CardFooter className="p-4 pt-0 flex justify-end">
                                {isAuthenticated && user && user.id !== vendor.userId && (
                                  <Button 
                                    className="bg-primary hover:bg-primary-dark text-white"
                                    onClick={() => {
                                      setSelectedServiceId(service.id);
                                      setIsBookingModalOpen(true);
                                    }}
                                  >
                                    Book Now
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-gray-500">No services listed yet.</p>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-secondary-dark">Customer Reviews</h3>
                    {isAuthenticated && user && user.id !== vendor.userId && (
                      <Button onClick={() => setIsReviewModalOpen(true)}>
                        Write a Review
                      </Button>
                    )}
                  </div>
                  
                  {vendor.reviews && vendor.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {vendor.reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
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
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            {review.comment && (
                              <p className="mt-4 text-gray-700">{review.comment}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Booking Modal */}
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book a Service</DialogTitle>
              <DialogDescription>
                Schedule an appointment with {vendor.businessName}.
                {selectedServiceId && vendor.services && (
                  <span className="block mt-1 font-medium">
                    Service: {vendor.services.find(s => s.id === selectedServiceId)?.name}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...bookingForm}>
              <form onSubmit={bookingForm.handleSubmit(handleBookingSubmit)} className="space-y-4">
                <FormField
                  control={bookingForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={bookingForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any special requests or details about your booking"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createBookingMutation.isPending}>
                    {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Review Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with {vendor.businessName}.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...reviewForm}>
              <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className={`text-2xl focus:outline-none ${
                                rating <= field.value ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              onClick={() => field.onChange(rating)}
                            >
                              <i className="fas fa-star"></i>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reviewForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Review</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your experience with this vendor"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createReviewMutation.isPending}>
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
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

export default VendorProfilePage;

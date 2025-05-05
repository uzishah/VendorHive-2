import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import MainLayout from '@/layouts/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';

// Types for booking status
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Main Component
const BookingsPage: React.FC = () => {
  const { user, isAuthenticated, token, vendorProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isVendor = user?.role === 'vendor';
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Define booking type
  interface Booking {
    id: number;
    userId: number;
    vendorId: number;
    serviceId?: number;
    date: string;
    status: BookingStatus;
    notes?: string;
    userName?: string;
    serviceName?: string;
    vendorBusinessName?: string;
    serviceDetails?: string;
    time?: string;
    location?: string;
  }

  // Query for fetching bookings
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: [isVendor ? '/api/bookings/vendor' : '/api/bookings/user'],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // For navigation/redirection
  const [_, navigate] = useLocation();

  // Mutation for updating booking status
  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: BookingStatus }) => {
      const response = await apiRequest('PUT', `/api/bookings/${id}/status`, { status });
      return { data: await response.json(), bookingId: id, newStatus: status };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [isVendor ? '/api/bookings/vendor' : '/api/bookings/user'] });
      toast({
        title: 'Booking updated',
        description: 'The booking status has been updated successfully',
      });
      setIsDialogOpen(false);
      
      // If booking is confirmed and user is a vendor, redirect to payment page
      if (result.newStatus === 'confirmed' && isVendor) {
        navigate(`/payment?bookingId=${result.bookingId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update booking status',
        variant: 'destructive',
      });
    },
  });

  // Handler for status update
  const handleStatusUpdate = (id: number, status: BookingStatus) => {
    if (status === 'cancelled' && !cancellationReason) {
      setSelectedBooking({ id, targetStatus: status });
      setIsDialogOpen(true);
      return;
    }

    updateBookingStatus.mutate({ id, status });
  };

  // Handler for confirming cancellation
  const handleConfirmCancellation = () => {
    if (selectedBooking) {
      updateBookingStatus.mutate({ 
        id: selectedBooking.id, 
        status: selectedBooking.targetStatus 
      });
      setCancellationReason('');
    }
  };

  // Filter bookings by status
  const getFilteredBookings = (status: BookingStatus | 'all') => {
    if (!bookings) return [];
    if (status === 'all') return bookings;
    return Array.isArray(bookings) 
      ? bookings.filter((booking: any) => booking.status === status)
      : [];
  };

  // Functions to format the date, time and status
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM dd, yyyy');
  };

  const getStatusBadge = (status: BookingStatus) => {
    const statusConfig = {
      pending: { variant: 'outline', label: 'Pending' },
      confirmed: { variant: 'secondary', label: 'Confirmed' },
      completed: { variant: 'default', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-secondary-dark mb-4">
                  Please sign in to view your bookings
                </h2>
                <p className="text-gray-500 mb-6">
                  You need to be logged in to access your booking information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-12">
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-2xl">
              {isVendor ? 'Manage Customer Bookings' : 'My Bookings'}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="all">
              <TabsList className="mb-6 w-full grid grid-cols-5 max-w-xl">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                <TabsContent key={status} value={status}>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i}>
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:justify-between gap-4">
                              <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <div className="space-y-2">
                                <Skeleton className="h-5 w-36" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-10 w-32" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <>
                      {getFilteredBookings(status as any).length === 0 ? (
                        <div className="text-center py-12">
                          <h3 className="text-xl font-medium text-secondary-dark mb-2">
                            No {status !== 'all' ? status : ''} bookings found
                          </h3>
                          <p className="text-gray-500">
                            {isVendor
                              ? "You don't have any bookings from customers yet."
                              : "You haven't made any bookings yet."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getFilteredBookings(status as any).map((booking: any) => (
                            <Card key={booking.id}>
                              <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:justify-between gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="text-lg font-medium text-secondary-dark">
                                        {isVendor ? booking.userName : booking.serviceName || booking.vendorBusinessName}
                                      </h3>
                                      <p className="text-gray-500">
                                        {isVendor ? booking.serviceDetails || 'Booking Request' : booking.vendorBusinessName}
                                      </p>
                                      {getStatusBadge(booking.status)}
                                    </div>

                                    <div className="flex flex-col space-y-2">
                                      <div className="flex items-center text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>{formatDate(booking.date)}</span>
                                      </div>
                                      
                                      {booking.time && (
                                        <div className="flex items-center text-gray-600">
                                          <Clock className="h-4 w-4 mr-2" />
                                          <span>{booking.time}</span>
                                        </div>
                                      )}
                                      
                                      {booking.location && (
                                        <div className="flex items-center text-gray-600">
                                          <MapPin className="h-4 w-4 mr-2" />
                                          <span>{booking.location}</span>
                                        </div>
                                      )}

                                      {booking.notes && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                          <p className="text-sm text-gray-700">{booking.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col space-y-3 self-end md:self-center">
                                    {booking.status === 'pending' && (
                                      <div className="flex space-x-2">
                                        {isVendor && (
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                            disabled={updateBookingStatus.isPending}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Confirm
                                          </Button>
                                        )}
                                        
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                          disabled={updateBookingStatus.isPending}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    )}

                                    {booking.status === 'confirmed' && (
                                      <div className="flex space-x-2">
                                        {isVendor && (
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                            disabled={updateBookingStatus.isPending}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Mark Completed
                                          </Button>
                                        )}
                                        
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                          disabled={updateBookingStatus.isPending}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">Please provide a reason for cancellation:</p>
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setCancellationReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmCancellation}
              disabled={!cancellationReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default BookingsPage;
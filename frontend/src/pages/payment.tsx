import React from 'react';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function PaymentPage() {
  const [_, navigate] = useLocation();
  // Extract booking ID from URL search params if available
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('bookingId');

  return (
    <MainLayout>
      <div className="container py-12 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => navigate('/bookings')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bookings
            </Button>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="bg-green-50 dark:bg-green-950 rounded-t-lg">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500 mr-4" />
                <CardTitle className="text-2xl md:text-3xl">Booking Confirmed</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 md:p-10">
              <div className="grid gap-8">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Your booking (ID: <span className="font-semibold">{bookingId || 'Unknown'}</span>) has been 
                    successfully created and is awaiting confirmation from the service provider.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border">
                  <h3 className="font-semibold text-lg mb-4 text-center">
                    Booking Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <h4 className="font-medium">Status</h4>
                        <p className="text-green-600">Pending confirmation</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <h4 className="font-medium">Contact</h4>
                        <p className="text-gray-600">The service provider will contact you soon to confirm your booking.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <h4 className="font-medium">Support</h4>
                        <p className="text-gray-600">For any questions, please contact support@vendorhive.com</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-sm text-gray-500">
                      Note: This page is currently under development.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <Separator />
            
            <CardFooter className="justify-between p-6">
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
              <Button 
                onClick={() => navigate('/bookings')}
              >
                View My Bookings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
import React from 'react';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  const [_, navigate] = useLocation();
  // Extract booking ID from URL search params if available
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('bookingId');

  return (
    <MainLayout>
      <div className="container py-24">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-dashed">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
              <h1 className="text-3xl font-bold mb-2">Payment Page Not Developed</h1>
              <p className="text-gray-500 text-lg mb-6">
                This payment processing page is currently not designed or developed. 
                {bookingId && <span> Your booking (ID: {bookingId}) has been confirmed.</span>}
              </p>
              <Button 
                onClick={() => navigate('/bookings')}
                size="lg"
              >
                Return to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
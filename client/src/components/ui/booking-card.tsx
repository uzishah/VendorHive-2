import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Booking } from '@/services/api';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onComplete?: (id: number) => void;
  userType?: 'user' | 'vendor';
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  booking, 
  onCancel, 
  onConfirm, 
  onComplete, 
  userType = 'user' 
}) => {
  return (
    <Card>
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
        
        {/* Action buttons based on status and user type */}
        {userType === 'user' && (booking.status === 'pending' || booking.status === 'confirmed') && onCancel && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onCancel(booking.id)}
            >
              Cancel Booking
            </Button>
          </div>
        )}
        
        {userType === 'vendor' && booking.status === 'pending' && onConfirm && onCancel && (
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onConfirm(booking.id)}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onCancel(booking.id)}
            >
              Decline
            </Button>
          </div>
        )}
        
        {userType === 'vendor' && booking.status === 'confirmed' && onComplete && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onComplete(booking.id)}
            >
              Mark as Completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCard;

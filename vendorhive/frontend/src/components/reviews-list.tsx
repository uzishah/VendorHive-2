import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StarRating from '@/components/ui/star-rating';

interface Review {
  id: number;
  userId: number;
  vendorId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    profileImage?: string;
  };
}

interface ReviewsListProps {
  vendorId: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ vendorId }) => {
  // Fetch reviews for this vendor
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: [`/api/vendors/${vendorId}/reviews`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">
            No reviews yet. Be the first to leave a review!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={review.user.profileImage} alt={review.user.name} />
                <AvatarFallback>{review.user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{review.user.name}</h4>
                  <p className="text-xs text-gray-500">
                    {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <StarRating rating={review.rating} size="sm" />
                {review.comment && (
                  <p className="text-gray-700 text-sm">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReviewsList;
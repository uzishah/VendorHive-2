import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from '@/components/ui/star-rating';
import { Review } from '@/services/api';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <Card>
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
  );
};

export default ReviewCard;

import React from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showCount = false,
  count = 0,
  className
}) => {
  const sizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };
  
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= rating;
          const isHalfFilled = !isFilled && starValue - 0.5 <= rating;
          
          return (
            <span key={i} className={`${sizeClass[size]} text-yellow-400`}>
              {isFilled ? (
                <i className="fas fa-star" />
              ) : isHalfFilled ? (
                <i className="fas fa-star-half-alt" />
              ) : (
                <i className="far fa-star" />
              )}
            </span>
          );
        })}
      </div>
      
      {showCount && (
        <span className="text-gray-500 text-sm ml-2">
          {count} {count === 1 ? 'review' : 'reviews'}
        </span>
      )}
    </div>
  );
};

export default StarRating;

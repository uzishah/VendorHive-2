import React from 'react';
import { Star as StarIcon } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCount?: boolean;
  count?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  size = 'md',
  className = '',
  showCount = false,
  count = 0,
}) => {
  // Calculate size in pixels based on size prop
  const getStarSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      case 'md':
      default: return 'w-4 h-4';
    }
  };

  const sizeClasses = getStarSize();

  // Generate stars array based on rating and max
  const stars = Array.from({ length: max }).map((_, index) => {
    const isFilled = index < Math.floor(rating);
    const isHalfFilled = !isFilled && index < Math.ceil(rating) && rating % 1 !== 0;
    
    return (
      <StarIcon
        key={index}
        className={`${sizeClasses} ${isFilled ? 'text-yellow-500 fill-yellow-500' : isHalfFilled ? 'text-yellow-500 fill-yellow-500 half-star' : 'text-gray-300'} ${className}`}
      />
    );
  });

  return (
    <div className="flex items-center">
      {stars}
      {rating > 0 && (
        <span className="ml-1.5 text-sm text-gray-600">
          {rating.toFixed(1)}
          {showCount && count > 0 && (
            <span className="ml-1 text-xs text-gray-500">({count} {count === 1 ? 'review' : 'reviews'})</span>
          )}
        </span>
      )}
    </div>
  );
};

export default StarRating;
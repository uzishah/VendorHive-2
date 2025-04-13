import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 'md', 
  showCount = false, 
  count = 0,
  className = '' 
}) => {
  // Calculate the integer and fractional parts of the rating
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  // Determine star sizes based on prop
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const starSize = starSizes[size];
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={`full-${i}`} 
            className={`${starSize} text-yellow-400 fill-yellow-400`}
          />
        ))}
        
        {/* Half star if applicable */}
        {hasHalfStar && (
          <div className="relative">
            <Star 
              className={`${starSize} text-gray-300 fill-gray-300`}
            />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star 
                className={`${starSize} text-yellow-400 fill-yellow-400`}
              />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className={`${starSize} text-gray-300`}
          />
        ))}
      </div>
      
      {/* Optional review count */}
      {showCount && (
        <span className="ml-2 text-xs text-gray-500">{`(${count})`}</span>
      )}
    </div>
  );
};

export default StarRating;
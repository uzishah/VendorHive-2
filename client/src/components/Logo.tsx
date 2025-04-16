import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  asLink?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', withText = true, asLink = false }) => {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };
  
  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  const content = (
    <div className="flex items-center cursor-pointer">
      <svg className={`${sizeMap[size]} text-primary`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H7v-2zm4 0h2v2h-2v-2z"/>
      </svg>
      {withText && (
        <span className={`ml-2 ${textSizeMap[size]} font-bold text-secondary-dark`}>
          VENDORHIVE
        </span>
      )}
    </div>
  );
  
  // Only wrap with Link if explicitly requested
  if (asLink) {
    return <Link href="/">{content}</Link>;
  }
  
  return content;
};

export default Logo;

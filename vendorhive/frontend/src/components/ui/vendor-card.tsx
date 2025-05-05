import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/ui/star-rating';
import { Vendor } from '@/services/api';

interface VendorCardProps {
  vendor: Vendor;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <div className="h-48 w-full overflow-hidden">
        <img 
          className="w-full h-full object-cover" 
          src={`https://source.unsplash.com/featured/?${encodeURIComponent(vendor.category)}`} 
          alt={`${vendor.businessName} cover`}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="text-sm font-bold">{vendor.businessName.charAt(0)}</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-secondary-dark">
              {vendor.businessName}
            </h3>
            <div className="flex items-center mt-1">
              <StarRating rating={vendor.rating} showCount={true} count={vendor.reviewCount} />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {vendor.category}
          </span>
        </div>
        <p className="mt-3 text-base text-gray-500">
          {vendor.description.length > 100 
            ? `${vendor.description.substring(0, 100)}...` 
            : vendor.description}
        </p>
        <div className="mt-4">
          <Link href={`/vendors/${vendor.id}`}>
            <Button variant="outline" className="text-primary hover:bg-primary hover:text-white">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorCard;

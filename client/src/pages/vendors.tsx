import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import StarRating from '@/components/ui/star-rating';
import { getVendors } from '@/services/api';
import { Search, Filter, Star } from 'lucide-react';

// Common categories for vendors
const CATEGORIES = [
  'Home Services',
  'Professional Services', 
  'Beauty & Wellness',
  'Events',
  'Education',
  'Health',
  'Technology',
  'Food & Catering',
  'Fitness',
  'Transportation',
  'Other'
];

const VendorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: vendors, isLoading, refetch } = useQuery({
    queryKey: ['/api/vendors', activeSearch],
    queryFn: () => getVendors(activeSearch)
  });
  
  // Apply filters to the vendors data
  const filteredVendors = vendors ? vendors.filter(vendor => {
    // Filter by category if selected
    if (selectedCategory && vendor.category !== selectedCategory) {
      return false;
    }
    
    // Filter by minimum rating
    if (minRating > 0 && vendor.rating < minRating) {
      return false;
    }
    
    return true;
  }) : [];

  // Effect to refetch when filters change
  useEffect(() => {
    refetch();
  }, [refetch, selectedCategory, minRating]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };
  
  const resetFilters = () => {
    setSelectedCategory('');
    setMinRating(0);
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-secondary-dark sm:text-4xl">
            Find the Perfect Vendor
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Connect with verified service providers in your area
          </p>
          
          <form onSubmit={handleSearch} className="mt-8 flex max-w-md mx-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search vendors by name, category, or service..."
                className="pl-10 pr-4 py-2 w-full rounded-l-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-l-none bg-primary hover:bg-primary-dark">
              Search
            </Button>
          </form>
          
          {/* Filter section */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                className="flex items-center text-gray-600" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              {(selectedCategory || minRating > 0) && (
                <Button 
                  variant="ghost" 
                  className="text-gray-600" 
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              )}
            </div>
            
            {showFilters && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category-filter" className="mb-2 block">Category</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger id="category-filter" className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Minimum Rating</Label>
                      <div className="flex items-center space-x-4">
                        {[0, 1, 2, 3, 4, 5].map(rating => (
                          <div key={rating} className="flex items-center">
                            <input 
                              type="radio" 
                              id={`rating-${rating}`}
                              name="min-rating"
                              value={rating}
                              checked={minRating === rating}
                              onChange={() => setMinRating(rating)}
                              className="sr-only"
                            />
                            <label 
                              htmlFor={`rating-${rating}`}
                              className={`flex items-center cursor-pointer rounded-md px-2 py-1 ${
                                minRating === rating 
                                  ? 'bg-primary text-white' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {rating === 0 ? (
                                <span>Any</span>
                              ) : (
                                <div className="flex items-center">
                                  <span>{rating}+</span>
                                  <Star className="h-3 w-3 ml-1" />
                                </div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {isLoading ? (
            // Show loading skeletons
            Array(6).fill(0).map((_, index) => (
              <Card key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="h-48 w-full bg-gray-200 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="mt-1 h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  </div>
                  <div className="mt-3 h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="mt-1 h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="mt-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : vendors && filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="bg-white overflow-hidden shadow rounded-lg">
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
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                {activeSearch ? 
                  "No vendors found for your search term." : 
                  "No vendors match the selected filters."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearch('');
                  resetFilters();
                }}
              >
                Clear All Filters & Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default VendorsPage;

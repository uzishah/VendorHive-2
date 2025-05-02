import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  ArrowUpDown, 
  X,
  Grid,
  Home,
  Briefcase,
  Sparkles,
  GraduationCap,
  List,
  SortAsc,
  SortDesc,
  DollarSign
} from 'lucide-react';

import { ServiceWithVendor, getAllServices } from '@/services/api';

// Use Star as StarIcon for our specific scenario
const StarIcon = Star;

// Common categories for services
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

// Define price ranges for filtering
const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: Infinity },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200+', min: 200, max: Infinity },
];

// Sorting options
const SORT_OPTIONS = [
  { value: 'none', label: 'Default' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'rating_low_high', label: 'Rating: Low to High' },
  { value: 'rating_high_low', label: 'Rating: High to Low' }
];

const ServicesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0); // Index of PRICE_RANGES
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState<string>('none');
  
  const { data: services = [], isLoading, refetch } = useQuery<ServiceWithVendor[]>({
    queryKey: ['/api/services', activeSearch],
    queryFn: getAllServices
  });
  
  // Apply filters to the services data
  const filteredServices = services.filter(service => {
    // Filter by search query if active
    if (activeSearch && !service.name.toLowerCase().includes(activeSearch.toLowerCase()) && 
        !service.description.toLowerCase().includes(activeSearch.toLowerCase())) {
      return false;
    }
    
    // Filter by category if selected (and not 'all')
    if (selectedCategory && selectedCategory !== 'all' && service.category !== selectedCategory) {
      return false;
    }
    
    // Filter by price range if selected
    if (selectedPriceRange > 0) {
      const priceRange = PRICE_RANGES[selectedPriceRange];
      const servicePrice = parseFloat(service.price.replace(/[^0-9.]/g, ''));
      
      if (isNaN(servicePrice) || servicePrice < priceRange.min || servicePrice > priceRange.max) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting based on selected option
    switch (sortOption) {
      case 'price_low_high':
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
        return priceA - priceB;
      
      case 'price_high_low':
        const priceAHigh = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
        const priceBHigh = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
        return priceBHigh - priceAHigh;
      
      case 'rating_low_high':
        const ratingA = a.vendorInfo?.rating || 0;
        const ratingB = b.vendorInfo?.rating || 0;
        return ratingA - ratingB;
      
      case 'rating_high_low':
        const ratingAHigh = a.vendorInfo?.rating || 0;
        const ratingBHigh = b.vendorInfo?.rating || 0;
        return ratingBHigh - ratingAHigh;
      
      default:
        return 0;
    }
  });

  // Effect to refetch when filters change
  useEffect(() => {
    refetch();
  }, [refetch, selectedCategory, selectedPriceRange]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };
  
  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange(0);
    setSortOption('none');
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-secondary-dark sm:text-4xl">
            Find the Perfect Service
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Browse services offered by trusted vendors in the VendorHive marketplace
          </p>
          
          <form onSubmit={handleSearch} className="mt-8 flex max-w-md mx-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search services by name, category, or description..."
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
                size="sm"
                className="flex items-center text-gray-600 p-2" 
                onClick={() => setShowFilters(!showFilters)}
                title={showFilters ? 'Hide Filters' : 'Show Filters'}
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </Button>
              
              {(selectedCategory !== 'all' || selectedPriceRange > 0 || sortOption !== 'none') && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 p-2" 
                  onClick={resetFilters}
                  title="Reset Filters"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Reset Filters</span>
                </Button>
              )}
            </div>
            
            {showFilters && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="mb-2 block">Category</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedCategory === 'all' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedCategory('all')}
                          title="All Categories"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedCategory === 'Home Services' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedCategory('Home Services')}
                          title="Home Services"
                        >
                          <Home className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedCategory === 'Professional Services' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedCategory('Professional Services')}
                          title="Professional Services"
                        >
                          <Briefcase className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedCategory === 'Beauty & Wellness' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedCategory('Beauty & Wellness')}
                          title="Beauty & Wellness"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedCategory === 'Education' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedCategory('Education')}
                          title="Education"
                        >
                          <GraduationCap className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Price Range</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedPriceRange === 0 ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedPriceRange(0)}
                          title="Any Price"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedPriceRange === 1 ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedPriceRange(1)}
                          title="Under $50"
                        >
                          <span className="text-xs mr-1">$</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedPriceRange === 2 ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedPriceRange(2)}
                          title="$50 - $100"
                        >
                          <span className="text-xs mr-1">$$</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedPriceRange === 3 ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedPriceRange(3)}
                          title="$100 - $200"
                        >
                          <span className="text-xs mr-1">$$$</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedPriceRange === 4 ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSelectedPriceRange(4)}
                          title="$200+"
                        >
                          <span className="text-xs mr-1">$$$$</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Sort By</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={sortOption === 'none' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSortOption('none')}
                          title="Default"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={sortOption === 'price_low_high' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSortOption('price_low_high')}
                          title="Price: Low to High"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                          <DollarSign className="h-3 w-3 ml-1" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={sortOption === 'price_high_low' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSortOption('price_high_low')}
                          title="Price: High to Low"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={sortOption === 'rating_high_low' ? 'default' : 'outline'}
                          className="flex items-center"
                          onClick={() => setSortOption('rating_high_low')}
                          title="Rating: High to Low"
                        >
                          <StarIcon className="h-4 w-4" />
                        </Button>
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
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <Card key={service.id} className="bg-white overflow-hidden shadow rounded-lg">
                {service.imageUrl ? (
                  <div className="h-48 w-full overflow-hidden">
                    <img 
                      className="w-full h-full object-cover" 
                      src={service.imageUrl} 
                      alt={service.name}
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-xl">{service.name}</span>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-dark">{service.name}</h3>
                      <p className="text-primary font-semibold">{service.price}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {service.category}
                    </span>
                  </div>
                  
                  {service.vendorInfo && (
                    <Link href={`/vendors/${service.vendorInfo?.id || 0}`}>
                      <div className="flex items-center mt-2 mb-1 text-sm text-gray-600 hover:text-primary cursor-pointer">
                        <span>Offered by: {service.vendorInfo?.businessName}</span>
                      </div>
                      <div className="flex items-center mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= (service.vendorInfo?.rating || 0)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-gray-600">
                          ({(service.vendorInfo?.rating || 0).toFixed(1)})
                        </span>
                      </div>
                    </Link>
                  )}
                  
                  <p className="mt-2 text-base text-gray-500 line-clamp-3">
                    {service.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                    {service.duration && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{service.duration}</span>
                      </div>
                    )}
                    
                    {service.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{service.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Link href={`/vendors/${service.vendorId}`}>
                      <Button variant="outline" className="text-primary hover:bg-primary hover:text-white">
                        View Vendor
                      </Button>
                    </Link>
                    <Link href={`/vendors/${service.vendorId}?serviceId=${service.id}&book=true`}>
                      <Button className="bg-primary hover:bg-primary-dark text-white">
                        Book Now
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
                  "No services found for your search term." : 
                  "No services match the selected filters."}
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

export default ServicesPage;
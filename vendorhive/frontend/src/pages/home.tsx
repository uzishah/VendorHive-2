import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from '@/components/ui/star-rating';
import { getVendors } from '@/services/api';
import { Search, Calendar, Star, ShieldCheck } from 'lucide-react';

const HomePage: React.FC = () => {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    select: (data) => data.slice(0, 3) // Show only 3 vendors on the homepage
  });

  return (
    <MainLayout>
      {/* Hero section */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-secondary-dark sm:text-5xl md:text-6xl">
                <span className="block">Smart Booking,</span>
                <span className="block text-primary">Reliable Services!</span>
              </h1>
              <p className="mt-6 text-base text-gray-500 sm:text-lg md:text-xl">
                Connect with top vendors for all your needs. From event planning to home services, VendorHive makes booking hassle-free and reliable.
              </p>
              <div className="mt-8 flex space-x-4">
                <Link href="/vendors">
                  <Button className="px-6 py-3 bg-primary hover:bg-primary-dark">
                    Find vendors
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" className="px-6 py-3">
                    How it works
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="rounded-lg shadow-xl overflow-hidden">
                <img 
                  className="w-full h-auto" 
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="People collaborating" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary-dark sm:text-4xl">
              A better way to find reliable vendors
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Get access to top-rated services with our verified vendor network.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-secondary-dark">Verified Vendors</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  All vendors on our platform are vetted and verified to ensure quality service delivery.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-secondary-dark">Easy Booking</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Book services with just a few clicks. Schedule appointments that work for your timeline.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Star className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-secondary-dark">Reviews & Ratings</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Read authentic reviews from real customers to make informed decisions.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-secondary-dark">Secure Payments</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Enjoy secure payment processing with protection for both customers and vendors.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      
      {/* Top Vendors Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Featured Vendors</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary-dark sm:text-4xl">
              Top-rated service providers
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // Show loading skeletons
              Array(3).fill(0).map((_, index) => (
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
            ) : vendors && vendors.length > 0 ? (
              vendors.map((vendor) => (
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
                      {vendor.description}
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
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No vendors available at the moment.</p>
              </div>
            )}
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/vendors">
              <Button className="px-6 py-3 bg-primary hover:bg-primary-dark">
                Browse All Vendors
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Process</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-secondary-dark sm:text-4xl">
              How VendorHive Works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Simple steps to connect with the right service providers.
            </p>
          </div>

          <div className="py-12">
            <div className="max-w-xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <div className="relative">
                <div className="absolute inset-0 h-1/2 bg-white"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-4xl mx-auto">
                    <dl className="rounded-lg bg-white shadow-lg sm:grid sm:grid-cols-3">
                      <div className="flex flex-col border-b border-gray-100 p-6 text-center sm:border-0 sm:border-r">
                        <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                          Create an Account
                        </dt>
                        <dd className="order-1 text-5xl font-extrabold text-primary">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-light text-white">
                            <i className="fas fa-user-plus text-2xl"></i>
                          </div>
                        </dd>
                        <dd className="order-3 mt-4 text-base text-gray-500">
                          Sign up as a customer or vendor in just a few minutes.
                        </dd>
                      </div>
                      <div className="flex flex-col border-t border-b border-gray-100 p-6 text-center sm:border-0 sm:border-l sm:border-r">
                        <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                          Find Services
                        </dt>
                        <dd className="order-1 text-5xl font-extrabold text-primary">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-light text-white">
                            <Search className="h-8 w-8" />
                          </div>
                        </dd>
                        <dd className="order-3 mt-4 text-base text-gray-500">
                          Browse through our verified vendors or post your requirements.
                        </dd>
                      </div>
                      <div className="flex flex-col border-t border-gray-100 p-6 text-center sm:border-0 sm:border-l">
                        <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                          Book & Pay
                        </dt>
                        <dd className="order-1 text-5xl font-extrabold text-primary">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-light text-white">
                            <Calendar className="h-8 w-8" />
                          </div>
                        </dd>
                        <dd className="order-3 mt-4 text-base text-gray-500">
                          Schedule services and make secure payments through our platform.
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-white opacity-90">Join our community today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth?tab=register">
                <Button variant="secondary" className="px-5 py-3 text-primary bg-white hover:bg-gray-50">
                  Sign up
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link href="/vendors">
                <Button variant="default" className="px-5 py-3 text-white bg-primary-dark hover:bg-primary-dark">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default HomePage;

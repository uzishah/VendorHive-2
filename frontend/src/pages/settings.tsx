import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ImagePlus } from 'lucide-react';

export default function SettingsPage() {
  const { user, token, isAuthenticated, updateProfile, vendorProfile, updateVendorProfile } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
  });
  
  const [vendorData, setVendorData] = useState({
    businessName: vendorProfile?.businessName || '',
    category: vendorProfile?.category || '',
    description: vendorProfile?.description || '',
    coverImage: vendorProfile?.coverImage || '',
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return updateProfile(data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update vendor profile mutation
  const updateVendorMutation = useMutation({
    mutationFn: async (data: typeof vendorData) => {
      if (!vendorProfile) return null;
      return updateVendorProfile(data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Vendor profile updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };
  
  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendorMutation.mutate(vendorData);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/users/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setProfileData((prev) => ({ ...prev, profileImage: data.profileImage }));
      
      // Update profile with new image
      updateProfileMutation.mutate({
        ...profileData,
        profileImage: data.profileImage,
      });
      
      toast({
        title: 'Success',
        description: 'Profile image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingCover(true);
      
      const formData = new FormData();
      formData.append('coverImage', file);
      
      const response = await fetch('/api/vendors/cover-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload cover image');
      }
      
      const data = await response.json();
      setVendorData((prev) => ({ ...prev, coverImage: data.coverImage }));
      
      // Update vendor profile with new cover image
      updateVendorMutation.mutate({
        ...vendorData,
        coverImage: data.coverImage,
      });
      
      toast({
        title: 'Success',
        description: 'Cover image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload cover image',
        variant: 'destructive',
      });
    } finally {
      setUploadingCover(false);
    }
  };
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-500">Manage your account settings and preferences</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <Card className="md:row-span-2">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="mb-4 relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profileData.profileImage} alt={profileData.name} />
                  <AvatarFallback className="text-2xl">
                    {profileData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="absolute bottom-1 right-1">
                  <Input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Label
                    htmlFor="profile-image"
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white cursor-pointer shadow-md hover:bg-primary-dark"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </Label>
                </div>
              </div>
              
              <h3 className="font-medium text-lg mb-1">{user.name}</h3>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              
              {user.role === 'vendor' && vendorProfile && (
                <div className="mt-4 w-full">
                  <Separator className="my-4" />
                  <div className="text-center">
                    <h4 className="font-medium text-sm uppercase text-gray-500 mb-2">Vendor Info</h4>
                    <p className="font-medium">{vendorProfile.businessName}</p>
                    <p className="text-sm text-gray-500">{vendorProfile.category}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Tabs defaultValue="account" className="flex-1">
            <TabsList className="mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              {user.role === 'vendor' && vendorProfile && (
                <TabsTrigger value="business">Business Profile</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={profileData.username}
                          onChange={handleInputChange}
                          placeholder="Username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          placeholder="Your email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          placeholder="Phone number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={profileData.location}
                          onChange={handleInputChange}
                          placeholder="Your location"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="mt-4"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {user.role === 'vendor' && vendorProfile && (
              <TabsContent value="business">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Profile</CardTitle>
                    <CardDescription>
                      Update your business information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVendorSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            name="businessName"
                            value={vendorData.businessName}
                            onChange={handleVendorInputChange}
                            placeholder="Your business name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            name="category"
                            value={vendorData.category}
                            onChange={handleVendorInputChange}
                            placeholder="Business category"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={vendorData.description}
                          onChange={handleVendorInputChange}
                          placeholder="Describe your business"
                          rows={6}
                        />
                      </div>
                      
                      <div className="space-y-4 mt-4">
                        <Label className="text-base font-medium">Business Cover Image</Label>
                        
                        <div className="flex flex-col space-y-4">
                          {vendorData.coverImage && (
                            <div className="w-full h-48 relative rounded-md overflow-hidden border">
                              <img 
                                src={vendorData.coverImage} 
                                alt="Business Cover" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Input
                              type="file"
                              id="cover-image"
                              accept="image/*"
                              onChange={handleCoverImageUpload}
                              disabled={uploadingCover}
                              className="hidden"
                            />
                            <Label
                              htmlFor="cover-image"
                              className="flex items-center justify-center py-2 px-4 rounded bg-primary text-white cursor-pointer hover:bg-primary-dark"
                            >
                              {uploadingCover ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <ImagePlus className="mr-2 h-4 w-4" />
                                  {vendorData.coverImage ? 'Change Cover Image' : 'Upload Cover Image'}
                                </>
                              )}
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="mt-6"
                        disabled={updateVendorMutation.isPending}
                      >
                        {updateVendorMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Update Business Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
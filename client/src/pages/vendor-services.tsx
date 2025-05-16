import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash, ImagePlus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { type Service } from '@/services/api';

const SERVICE_CATEGORIES = [
  "Cleaning",
  "Plumbing",
  "Electrical",
  "Painting",
  "Landscaping",
  "Carpentry",
  "Appliance Repair",
  "HVAC",
  "Roofing",
  "Home Security",
  "Pest Control",
  "Flooring",
  "Moving",
  "Other"
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const amPm = i < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${amPm}`;
});

interface ServiceFormData {
  name: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  location: string;
  imageUrl: string;
  timeSlots: { day: string; startTime: string; endTime: string }[];
  availableDates: Date[];
  availability: boolean;
}

function ServiceForm({ 
  initialData, 
  onSubmit, 
  isSubmitting,
  authToken
}: { 
  initialData?: Partial<ServiceFormData>; 
  onSubmit: (data: ServiceFormData) => void; 
  isSubmitting: boolean;
  authToken: string | null;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ServiceFormData>({
    name: initialData?.name || '',
    category: initialData?.category || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    duration: initialData?.duration || '1 hour',
    location: initialData?.location || '',
    imageUrl: initialData?.imageUrl || '',
    timeSlots: initialData?.timeSlots || [{ day: 'Monday', startTime: '9:00 AM', endTime: '5:00 PM' }],
    availableDates: initialData?.availableDates || [],
    availability: initialData?.availability !== false,
  });
  
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(
    initialData?.availableDates || []
  );
  
  const [uploading, setUploading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTimeSlot = () => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { day: 'Monday', startTime: '9:00 AM', endTime: '5:00 PM' }],
    }));
  };

  const handleTimeSlotChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updatedTimeSlots = [...prev.timeSlots];
      updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };
      return { ...prev, timeSlots: updatedTimeSlots };
    });
  };

  const handleRemoveTimeSlot = (index: number) => {
    setFormData((prev) => {
      const updatedTimeSlots = [...prev.timeSlots];
      updatedTimeSlots.splice(index, 1);
      return { ...prev, timeSlots: updatedTimeSlots };
    });
  };
  
  // Modified to prevent unexpected triggering
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent event propagation to stop the dialog from opening unexpectedly
    e.stopPropagation();
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          // Include the auth token for authentication
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
        credentials: 'include'
        // No Content-Type header, let the browser set it with the boundary
      });
      
      if (response.ok) {
        const { imageUrl } = await response.json();
        setFormData((prev) => ({ ...prev, imageUrl }));
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates((prev) => {
      const newDates = [...(prev || [])];
      const existingIndex = newDates.findIndex(
        (d) => d.toDateString() === date.toDateString()
      );
      
      if (existingIndex >= 0) {
        newDates.splice(existingIndex, 1);
      } else {
        newDates.push(date);
      }
      
      setFormData((prevData) => ({
        ...prevData,
        availableDates: newDates,
      }));
      
      return newDates;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-2">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Service Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
                required
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              required
              className="resize-none"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="price" className="text-sm">Price *</Label>
              <Input
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="$50/hour"
                required
                className="h-9"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="duration" className="text-sm">Duration</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="1 hour"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="location" className="text-sm">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Service address or 'Remote'"
              className="h-9"
            />
          </div>
          
          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="availability"
              checked={formData.availability}
              onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="availability" className="text-sm">
              Service is currently available
            </Label>
          </div>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-3 pt-2">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Time Slots</h3>
            <p className="text-xs text-gray-500">Define when this service is available during the week</p>
            
            {formData.timeSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-7 gap-2 items-center bg-gray-50 p-3 rounded-md">
                <div className="col-span-2">
                  <Label htmlFor={`day-${index}`}>Day</Label>
                  <Select
                    value={slot.day}
                    onValueChange={(value) => handleTimeSlotChange(index, 'day', value)}
                  >
                    <SelectTrigger id={`day-${index}`}>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`startTime-${index}`}>Start Time</Label>
                  <Select
                    value={slot.startTime}
                    onValueChange={(value) => handleTimeSlotChange(index, 'startTime', value)}
                  >
                    <SelectTrigger id={`startTime-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor={`endTime-${index}`}>End Time</Label>
                  <Select
                    value={slot.endTime}
                    onValueChange={(value) => handleTimeSlotChange(index, 'endTime', value)}
                  >
                    <SelectTrigger id={`endTime-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mt-5"
                  onClick={() => handleRemoveTimeSlot(index)}
                  disabled={formData.timeSlots.length === 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTimeSlot}
              className="w-full mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Time Slot
            </Button>
          </div>
          
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Available Dates</h3>
            <p className="text-sm text-gray-500">Select specific dates when this service is available</p>
            
            <div className="flex justify-center bg-gray-50 p-4 rounded-md">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={handleDateSelect as any}
                className="rounded-md border"
              />
            </div>
            
            <div className="text-sm">
              <p><strong>Selected dates:</strong> {selectedDates?.length || 0}</p>
              {selectedDates && selectedDates.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {selectedDates.map((date, i) => (
                    <div key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {date.toLocaleDateString()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="space-y-4 pt-4">
          <div className="space-y-4">
            <p className="text-sm font-medium">Service Image</p>
            
            <div className="flex items-center space-x-4">
              <div className="w-full">
                <Input
                  type="file"
                  id="service-image-upload"
                  accept="image/*"
                  onChange={(e) => {
                    // Only process the event if files exist
                    if (e.target.files && e.target.files[0]) {
                      // Stop the event from bubbling up
                      e.stopPropagation();
                      handleImageUpload(e);
                    }
                  }}
                  disabled={uploading}
                  className="hidden"
                  onClick={(e) => {
                    // Prevent click event from propagating to parent elements
                    e.stopPropagation();
                  }}
                />
                <label
                  htmlFor="service-image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={(e) => {
                    // Make sure this click event only triggers the file input and doesn't bubble up
                    e.stopPropagation();
                  }}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover mb-2" 
                      />
                      <span className="text-sm text-gray-500">
                        Click to change image
                      </span>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">
                        Click to upload an image
                      </span>
                    </>
                  )}
                </label>
              </div>
              
              {formData.imageUrl && (
                <div className="w-32 h-32 rounded-md overflow-hidden border">
                  <img
                    src={formData.imageUrl}
                    alt="Service preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            {formData.imageUrl && (
              <Input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Image URL"
                className="mt-2"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Service' : 'Create Service'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function VendorServicesPage() {
  const { user, vendorProfile, isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  // Redirect if not authenticated or not a vendor
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else if (user && user.role !== 'vendor') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/services/vendor'],
    queryFn: async () => {
      try {
        // Use API Request helper for consistent auth token handling
        const response = await apiRequest('GET', '/api/services/vendor');
        if (!response.ok) {
          console.error('Failed to fetch services:', response.status);
          return [];
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    },
    // Enable the query even if vendor profile isn't loaded yet
    enabled: isAuthenticated && user?.role === 'vendor',
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      if (!vendorProfile) throw new Error('Vendor profile not found');
      
      const data = {
        ...serviceData,
        vendorId: vendorProfile.id,
      };
      
      const response = await fetch('/api/services', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/services/vendor'],
      });
      setServiceFormOpen(false);
      toast({
        title: 'Success',
        description: 'Service created successfully',
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

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ServiceFormData }) => {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/services/vendor'],
      });
      setServiceFormOpen(false);
      setEditingService(null);
      toast({
        title: 'Success',
        description: 'Service updated successfully',
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

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete service');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/services/vendor'],
      });
      setConfirmDeleteId(null);
      toast({
        title: 'Success',
        description: 'Service deleted successfully',
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

  const handleCreateSubmit = (data: ServiceFormData) => {
    createServiceMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: ServiceFormData) => {
    if (!editingService) return;
    updateServiceMutation.mutate({ id: editingService.id, data });
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setServiceFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId !== null) {
      deleteServiceMutation.mutate(confirmDeleteId);
    }
  };

  if (!isAuthenticated || (user && user.role !== 'vendor')) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manage Services</h1>
            <p className="text-gray-500">Create and manage your service offerings</p>
          </div>
          
          <Dialog open={serviceFormOpen} onOpenChange={setServiceFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
                <DialogDescription>
                  {editingService
                    ? 'Update your service information'
                    : 'Create a new service offering for your customers'}
                </DialogDescription>
              </DialogHeader>
              
              <ServiceForm
                initialData={editingService || undefined}
                onSubmit={editingService ? handleUpdateSubmit : handleCreateSubmit}
                isSubmitting={
                  editingService
                    ? updateServiceMutation.isPending
                    : createServiceMutation.isPending
                }
                authToken={token}
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">No services yet</h3>
            <p className="text-gray-500 mb-4">
              Start by adding your first service offering
            </p>
            <Button onClick={() => setServiceFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add New Service
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: Service) => (
              <Card key={service.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <CardDescription>{service.category}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {service.imageUrl && (
                    <div className="w-full h-40 mb-4 rounded-md overflow-hidden">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Price:</span>
                      <span className="ml-1">{service.price}</span>
                    </div>
                    
                    {service.duration && (
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{service.duration}</span>
                      </div>
                    )}
                    
                    {service.location && (
                      <div className="col-span-2">
                        <span className="font-medium">Location:</span>
                        <span className="ml-1">{service.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-4 flex justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.availability
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {service.availability ? 'Available' : 'Unavailable'}
                  </span>
                  
                  <span className="text-sm text-gray-500">
                    {service.timeSlots?.length || 0} time slots
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              service from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {deleteServiceMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
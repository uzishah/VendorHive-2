import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Service } from '@/services/api';
import { Clock } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onBook?: (serviceId: number) => void;
  showBookButton?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook, showBookButton = true }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">{service.name}</CardTitle>
        <CardDescription>
          {service.duration && <span className="block text-sm">{service.duration}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
        <p className="font-semibold text-primary">{service.price}</p>
      </CardContent>
      {showBookButton && onBook && (
        <CardFooter className="p-4 pt-0 flex justify-end">
          <Button 
            variant="outline"
            onClick={() => onBook(service.id)}
          >
            Book Service
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ServiceCard;

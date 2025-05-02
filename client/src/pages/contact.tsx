import React from 'react';
import MainLayout from '@/layouts/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="container py-24">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-dashed">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
              <h1 className="text-3xl font-bold mb-2">Page Not Developed</h1>
              <p className="text-gray-500 text-lg">
                This page is currently not designed or developed. Please check back later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Navigation, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCoordinates } from '@/lib/formatters';

interface LocationPickerProps {
  value?: string;
  onChange: (coordinates: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function LocationPicker({
  value = '',
  onChange,
  label = 'Location',
  description,
  disabled = false
}: LocationPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [copied, setCopied] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        toast({
          title: "Error",
          description: "Geolocation is not supported by this browser",
          variant: "destructive",
        });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setManualLat(latitude.toString());
        setManualLng(longitude.toString());
        setIsGettingLocation(false);
        toast({
          title: "Success",
          description: "Location detected successfully!",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSetLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Error",
        description: "Please enter valid coordinates",
        variant: "destructive",
      });
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast({
        title: "Error",
        description: "Latitude must be between -90 and 90",
        variant: "destructive",
      });
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast({
        title: "Error",
        description: "Longitude must be between -180 and 180",
        variant: "destructive",
      });
      return;
    }
    
    const coordinates = `${lat}, ${lng}`;
    onChange(coordinates);
    setIsDialogOpen(false);
    toast({
      title: "Success",
      description: "Location updated successfully!",
    });
  };

  const handleCopyCoordinates = async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast({
          title: "Success",
          description: "Coordinates copied to clipboard!",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy coordinates",
          variant: "destructive",
        });
      }
    }
  };

  const openInMaps = () => {
    if (value) {
      const [lat, lng] = value.split(',').map(coord => coord.trim());
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // Parse existing coordinates for manual input
  React.useEffect(() => {
    if (value && !manualLat && !manualLng) {
      const [lat, lng] = value.split(',').map(coord => coord.trim());
      if (lat && lng) {
        setManualLat(lat);
        setManualLng(lng);
      }
    }
  }, [value, manualLat, manualLng]);

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      <Card>
        <CardContent className="p-4">
          {value ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Location Set</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCoordinates}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openInMaps}
                  >
                    View on Map
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                {formatCoordinates(value)}
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={disabled}>
                    Update Location
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby="location-dialog-desc">
                  <DialogHeader>
                    <DialogTitle>Update Business Location</DialogTitle>
                  </DialogHeader>
                  <p id="location-dialog-desc" className="sr-only">Set your business GPS coordinates using your device location or by entering them manually.</p>
                  <LocationPickerContent
                    manualLat={manualLat}
                    manualLng={manualLng}
                    setManualLat={setManualLat}
                    setManualLng={setManualLng}
                    getCurrentLocation={getCurrentLocation}
                    isGettingLocation={isGettingLocation}
                    handleSetLocation={handleSetLocation}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-6">
              <MapPin className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">No location set</p>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={disabled}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Set Location
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby="location-set-dialog-desc">
                  <DialogHeader>
                    <DialogTitle>Set Business Location</DialogTitle>
                  </DialogHeader>
                  <p id="location-set-dialog-desc" className="sr-only">Set your business GPS coordinates using your device location or by entering them manually.</p>
                  <LocationPickerContent
                    manualLat={manualLat}
                    manualLng={manualLng}
                    setManualLat={setManualLat}
                    setManualLng={setManualLng}
                    getCurrentLocation={getCurrentLocation}
                    isGettingLocation={isGettingLocation}
                    handleSetLocation={handleSetLocation}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface LocationPickerContentProps {
  manualLat: string;
  manualLng: string;
  setManualLat: (lat: string) => void;
  setManualLng: (lng: string) => void;
  getCurrentLocation: () => void;
  isGettingLocation: boolean;
  handleSetLocation: () => void;
  onCancel: () => void;
}

function LocationPickerContent({
  manualLat,
  manualLng,
  setManualLat,
  setManualLng,
  getCurrentLocation,
  isGettingLocation,
  handleSetLocation,
  onCancel
}: LocationPickerContentProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-3">Option 1: Use Current Location</h4>
          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            This will use your device's GPS to detect your current location
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Option 2: Enter Coordinates Manually</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="-1.284100"
                type="number"
                step="any"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="36.815500"
                type="number"
                step="any"
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You can get coordinates from Google Maps by right-clicking on your location
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSetLocation}
          disabled={!manualLat || !manualLng}
        >
          Set Location
        </Button>
      </div>
    </div>
  );
}
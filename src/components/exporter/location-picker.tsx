'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Navigation, Copy, Check, Wifi } from 'lucide-react';
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [copied, setCopied] = useState(false);

  // IP-based location — no browser permission required
  const getLocationByIP = async () => {
    setIsGettingLocation(true);
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('IP lookup failed');
      const data = await res.json();
      if (!data.latitude || !data.longitude) throw new Error('No coordinates in response');

      const lat = parseFloat(data.latitude).toFixed(6);
      const lng = parseFloat(data.longitude).toFixed(6);
      const coordinates = `${lat}, ${lng}`;
      onChange(coordinates);
      setIsDialogOpen(false);
      toast({
        title: 'Location Set',
        description: `Location detected via network${data.city ? ` (${data.city})` : ''}. You can refine it manually if needed.`,
      });
    } catch {
      toast({
        title: 'Could Not Detect Location',
        description: 'Network location lookup failed. Please enter coordinates manually.',
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // GPS — precise but requires browser permission
  const getLocationByGPS = () => {
    if (!navigator.geolocation) {
      toast({ description: 'GPS not supported by this browser. Use network location or enter manually.' });
      return;
    }

    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const coordinates = `${lat}, ${lng}`;
        onChange(coordinates);
        setIsDialogOpen(false);
        setIsGettingGPS(false);
        toast({ title: 'Precise Location Set', description: 'GPS coordinates saved successfully.' });
      },
      (error) => {
        setIsGettingGPS(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            title: 'GPS Permission Denied',
            description: 'Browser blocked GPS. Use "Detect via Network" instead — it works without permission.',
            duration: 6000,
          });
        } else {
          toast({ description: 'GPS failed. Try network detection or enter coordinates manually.' });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSetLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: 'Invalid Coordinates', description: 'Please enter valid numbers.', variant: 'destructive' });
      return;
    }
    if (lat < -90 || lat > 90) {
      toast({ title: 'Invalid Latitude', description: 'Latitude must be between -90 and 90.', variant: 'destructive' });
      return;
    }
    if (lng < -180 || lng > 180) {
      toast({ title: 'Invalid Longitude', description: 'Longitude must be between -180 and 180.', variant: 'destructive' });
      return;
    }

    onChange(`${lat}, ${lng}`);
    setIsDialogOpen(false);
    toast({ title: 'Location Updated', description: 'Coordinates saved successfully.' });
  };

  const handleCopyCoordinates = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ description: 'Coordinates copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy coordinates.', variant: 'destructive' });
    }
  };

  const openInMaps = () => {
    if (value) {
      const [lat, lng] = value.split(',').map(c => c.trim());
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  React.useEffect(() => {
    if (value && !manualLat && !manualLng) {
      const [lat, lng] = value.split(',').map(c => c.trim());
      if (lat && lng) { setManualLat(lat); setManualLng(lng); }
    }
  }, [value, manualLat, manualLng]);

  const dialogContent = (
    <div className="space-y-5">
      {/* Option 1: Network (IP) — no permission needed */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Option 1: Detect Automatically</h4>
        <Button
          onClick={getLocationByIP}
          disabled={isGettingLocation || isGettingGPS}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Wifi className="w-4 h-4 mr-2" />
          {isGettingLocation ? 'Detecting...' : 'Use My Current Location'}
        </Button>
        <p className="text-xs text-gray-500 mt-1.5">
          Detects location via your network connection — no browser permission required.
        </p>
      </div>

      {/* Option 2: GPS — precise */}
      <div>
        <h4 className="font-medium mb-2 text-sm">Option 2: Use GPS (Precise)</h4>
        <Button
          variant="outline"
          onClick={getLocationByGPS}
          disabled={isGettingLocation || isGettingGPS}
          className="w-full"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {isGettingGPS ? 'Getting GPS...' : 'Use GPS Location'}
        </Button>
        <p className="text-xs text-gray-500 mt-1.5">
          More accurate but requires browser location permission.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
        </div>
      </div>

      {/* Option 3: Manual */}
      <div>
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
        <p className="text-xs text-gray-500 mt-1.5">
          Right-click any location on Google Maps to copy its coordinates.
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-1">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleSetLocation} disabled={!manualLat || !manualLng}>
          Set Location
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      {description && <p className="text-sm text-gray-600">{description}</p>}

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
                  <Button size="sm" variant="outline" onClick={handleCopyCoordinates}>
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={openInMaps}>View on Map</Button>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">{formatCoordinates(value)}</div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={disabled}>Update Location</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Update Business Location</DialogTitle></DialogHeader>
                  {dialogContent}
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
                    <MapPin className="w-4 h-4 mr-2" />Set Location
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Set Business Location</DialogTitle></DialogHeader>
                  {dialogContent}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

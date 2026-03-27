'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Navigation, Copy, Check, Wifi, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCoordinates } from '@/lib/formatters';

interface LocationPickerProps {
  value?: string;
  onChange: (coordinates: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export function LocationPicker({
  value = '',
  onChange,
  label = 'Location',
  description,
  disabled = false,
}: LocationPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [copied, setCopied] = useState(false);
  const [mapLat, setMapLat] = useState(-1.2921);   // default: Nairobi
  const [mapLng, setMapLng] = useState(36.8219);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const isSecure = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  // Sync manual inputs from value prop
  useEffect(() => {
    if (value) {
      const [lat, lng] = value.split(',').map(c => c.trim());
      if (lat && lng) {
        setManualLat(lat);
        setManualLng(lng);
        setMapLat(parseFloat(lat));
        setMapLng(parseFloat(lng));
      }
    }
  }, [value]);

  // Load Google Maps script once
  useEffect(() => {
    if (!isDialogOpen || !MAPS_KEY) return;
    if (window.google?.maps) { setMapLoaded(true); return; }

    const existing = document.getElementById('gmap-script');
    if (existing) { existing.addEventListener('load', () => setMapLoaded(true)); return; }

    const script = document.createElement('script');
    script.id = 'gmap-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [isDialogOpen]);

  // Init map when loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: mapLat, lng: mapLng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: { lat: mapLat, lng: mapLng },
      map,
      draggable: true,
      title: 'Drag to set location',
    });

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (!pos) return;
      const lat = pos.lat().toFixed(6);
      const lng = pos.lng().toFixed(6);
      setManualLat(lat);
      setManualLng(lng);
      setMapLat(pos.lat());
      setMapLng(pos.lng());
    });

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      marker.setPosition(e.latLng);
      const lat = e.latLng.lat().toFixed(6);
      const lng = e.latLng.lng().toFixed(6);
      setManualLat(lat);
      setManualLng(lng);
      setMapLat(e.latLng.lat());
      setMapLng(e.latLng.lng());
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  }, [mapLoaded]);

  // Pan map when lat/lng change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const pos = { lat: mapLat, lng: mapLng };
    mapInstanceRef.current.panTo(pos);
    markerRef.current.setPosition(pos);
  }, [mapLat, mapLng]);

  // Reset map instance when dialog closes so it re-inits on next open
  useEffect(() => {
    if (!isDialogOpen) {
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [isDialogOpen]);

  // IP-based location — no permission needed, multiple fallbacks
  const getLocationByIP = async () => {
    setIsGettingLocation(true);
    const providers = [
      () => fetch('https://ipapi.co/json/').then(r => r.json()).then(d => ({ lat: d.latitude, lng: d.longitude, city: d.city })),
      () => fetch('https://ip-api.com/json/').then(r => r.json()).then(d => ({ lat: d.lat, lng: d.lon, city: d.city })),
      () => fetch('https://ipwho.is/').then(r => r.json()).then(d => ({ lat: d.latitude, lng: d.longitude, city: d.city })),
    ];
    for (const provider of providers) {
      try {
        const { lat, lng, city } = await provider();
        if (!lat || !lng) continue;
        const latStr = parseFloat(lat).toFixed(6);
        const lngStr = parseFloat(lng).toFixed(6);
        setManualLat(latStr);
        setManualLng(lngStr);
        setMapLat(parseFloat(latStr));
        setMapLng(parseFloat(lngStr));
        toast({ title: 'Location Detected', description: `Network location${city ? ` (${city})` : ''} — drag the pin to refine.` });
        setIsGettingLocation(false);
        return;
      } catch { /* try next */ }
    }
    setIsGettingLocation(false);
    toast({ title: 'Detection Failed', description: 'Could not detect location. Please enter coordinates manually or click on the map.', variant: 'destructive' });
  };

  // GPS — precise, requires HTTPS + browser permission
  const getLocationByGPS = () => {
    if (!isSecure) {
      toast({
        title: 'HTTPS Required',
        description: 'GPS only works on secure (HTTPS) connections. Use "Detect via Network" or enter coordinates manually.',
        duration: 7000,
      });
      return;
    }
    if (!navigator.geolocation) {
      toast({ description: 'GPS not supported by this browser.' });
      return;
    }
    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setManualLat(lat);
        setManualLng(lng);
        setMapLat(pos.coords.latitude);
        setMapLng(pos.coords.longitude);
        setIsGettingGPS(false);
        toast({ title: 'GPS Location Set', description: 'Drag the pin to refine if needed.' });
      },
      (err) => {
        setIsGettingGPS(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast({ title: 'GPS Permission Denied', description: 'Allow location access in your browser settings, or use "Detect via Network" instead.', duration: 7000 });
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
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({ title: 'Out of Range', description: 'Latitude: -90 to 90, Longitude: -180 to 180.', variant: 'destructive' });
      return;
    }
    onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setIsDialogOpen(false);
    toast({ title: 'Location Saved' });
  };

  const handleCopyCoordinates = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const openInMaps = () => {
    if (value) {
      const [lat, lng] = value.split(',').map(c => c.trim());
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const dialogContent = (
    <div className="space-y-4">
      {/* HTTP warning */}
      {!isSecure && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>GPS requires HTTPS. Use "Detect via Network" or click the map to set your location.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Network detection */}
        <Button onClick={getLocationByIP} disabled={isGettingLocation || isGettingGPS} className="bg-green-600 hover:bg-green-700 text-sm h-9">
          <Wifi className="w-3.5 h-3.5 mr-1.5" />
          {isGettingLocation ? 'Detecting...' : 'Detect via Network'}
        </Button>
        {/* GPS */}
        <Button variant="outline" onClick={getLocationByGPS} disabled={isGettingLocation || isGettingGPS || !isSecure} className="text-sm h-9" title={!isSecure ? 'Requires HTTPS' : ''}>
          <Navigation className="w-3.5 h-3.5 mr-1.5" />
          {isGettingGPS ? 'Getting GPS...' : 'Use GPS'}
        </Button>
      </div>
      <p className="text-xs text-gray-400 -mt-2">Network works without permission. GPS requires HTTPS + browser permission.</p>

      {/* Map */}
      {MAPS_KEY ? (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Click the map or drag the pin to set your exact location:</p>
          <div ref={mapRef} className="w-full h-52 rounded-md border bg-gray-100" />
          {!mapLoaded && <p className="text-xs text-gray-400 text-center mt-1">Loading map...</p>}
        </div>
      ) : (
        <div className="bg-gray-50 border rounded p-3 text-xs text-gray-500 text-center">
          Map not available. Enter coordinates manually below or right-click on <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-green-600 underline">Google Maps</a> to copy coordinates.
        </div>
      )}

      {/* Manual inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Latitude</Label>
          <Input value={manualLat} onChange={e => { setManualLat(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) setMapLat(v); }} placeholder="-1.284100" type="number" step="any" className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Longitude</Label>
          <Input value={manualLng} onChange={e => { setManualLng(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) setMapLng(v); }} placeholder="36.815500" type="number" step="any" className="mt-1 h-9 text-sm" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleSetLocation} disabled={!manualLat || !manualLng}>Set Location</Button>
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
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Location Set</span>
                </div>
                <div className="flex gap-2">
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
                <DialogContent className="max-w-lg">
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
                <DialogContent className="max-w-lg">
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

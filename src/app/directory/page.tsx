'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Building2, MapPin, Tag, Package, CheckCircle, SlidersHorizontal, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/pagination';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { ExporterGridCard, ExporterGridCardSkeleton } from '@/components/exporter-grid-card';
import { apiClient, type Business as APIBusiness } from '@/lib/api';
import { COUNTIES, KENYAN_CITIES, INDUSTRIES, SECTORS_BY_INDUSTRY } from '@/lib/constants';
import { EXPORT_MARKETS } from '@/types/business';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export const dynamic = 'force-dynamic';

// ── Public business type ─────────────────────────────────────────────────────
interface PublicBusiness {
  id: string; name: string; sector: string; location: string;
  town?: string; county?: string; physicalAddress?: string;
  logoUrl?: string;
  products?: { id: string; name: string; category: string }[];
  serviceOffering?: string; verificationStatus: string;
}

const PUBLIC_PER_PAGE = 24;
const AUTH_PER_PAGE = 51;

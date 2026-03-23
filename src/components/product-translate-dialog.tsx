
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import { Skeleton } from './ui/skeleton';
import { Languages, Loader2 } from 'lucide-react';
import { useCenteredDialog } from '@/hooks/useCenteredDialog';
// AI translation temporarily disabled during migration

interface ProductTranslateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: any;
}

const supportedLanguages = [
    { code: 'sw', name: 'Swahili' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
];

export function ProductTranslateDialog({ isOpen, onOpenChange, product }: ProductTranslateDialogProps) {
    const dialogStyle = useCenteredDialog();
    const [targetLanguage, setTargetLanguage] = useState('sw');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedName, setTranslatedName] = useState('');
    const [translatedDescription, setTranslatedDescription] = useState('');

    const handleTranslate = async () => {
        setIsTranslating(true);
        const input: TranslateProductListingsInput = {
            productName: product.name,
            productDescription: product.description,
            targetLanguage: supportedLanguages.find(l => l.code === targetLanguage)?.name || 'Swahili',
        };
        try {
            const result = await translateProductListings(input);
            setTranslatedName(result.translatedName);
            setTranslatedDescription(result.translatedDescription);
        } catch (error) {

            setTranslatedName('Translation failed.');
            setTranslatedDescription('Could not translate the description.');
        } finally {
            setIsTranslating(false);
        }
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" style={dialogStyle}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-6 w-6" /> Translate Product Listing
          </DialogTitle>
          <DialogDescription>
            Translate &quot;{product.name}&quot; into another language using AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
                <h3 className='font-semibold mb-2'>Original (English)</h3>
                <div className='space-y-4 rounded-md border p-4 bg-muted/50'>
                    <h4 className='font-bold text-lg'>{product.name}</h4>
                    <p className='text-sm text-muted-foreground'>{product.description}</p>
                </div>
            </div>
             <div>
                <h3 className='font-semibold mb-2'>Translation</h3>
                <div className='space-y-4 rounded-md border p-4'>
                    {isTranslating ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-1/2" />
                        </div>
                    ) : translatedName ? (
                         <div className='space-y-2'>
                            <h4 className='font-bold text-lg text-primary'>{translatedName}</h4>
                            <p className='text-sm text-foreground'>{translatedDescription}</p>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Select a language and click &quot;Translate&quot;.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter className="sm:justify-between items-center gap-4">
            <div className="flex items-center gap-2">
                 <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {supportedLanguages.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handleTranslate} disabled={isTranslating}>
                    {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                    Translate
                </Button>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


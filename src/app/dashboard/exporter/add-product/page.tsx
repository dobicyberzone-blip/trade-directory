'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/ui/file-uploader';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Package, DollarSign, List } from 'lucide-react';
import { DEFAULT_IMAGE_OPTIONS } from '@/lib/file-validation';

const productSchema = z.object({
  name: z.string().min(2, { message: 'Product name is required.' }),
  description: z.string().min(10, { message: 'Please provide a detailed product description.' }),
  category: z.string().min(2, { message: 'Product category is required.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  unit: z.string().min(1, { message: 'Unit is required (e.g., kg, pieces).' }),
  imageUrl: z.string().optional().or(z.literal('')),
  minOrder: z.coerce.number().int().min(1, { message: 'Minimum order must be at least 1.' }),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      unit: 'kg',
      imageUrl: '',
      minOrder: 1,
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    try {
      await apiClient.createProduct({
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        unit: values.unit,
        imageUrl: values.imageUrl || undefined,
        minOrder: values.minOrder,
        availability: true,
      });
      toast({ title: 'Product Added!', description: `${values.name} has been added to your listings.` });
      router.push('/dashboard/exporter');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    }
  };

  return (
    <main className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="w-full shadow-sm border-0 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Add a New Product</CardTitle>
            <CardDescription>Showcase your products to global buyers. Fill out the details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hidden sm:block" />
                      <FormControl><Input placeholder="e.g., Premium Arabica Coffee Beans" {...field} className="sm:pl-10" /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe the product's features, origin, and quality..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="relative">
                      <List className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hidden sm:block" />
                      <FormControl><Input placeholder="e.g., Agriculture, Coffee" {...field} className="sm:pl-10" /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Price</FormLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hidden sm:block" />
                        <FormControl><Input type="number" placeholder="1000" {...field} className="sm:pl-10" /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Unit</FormLabel>
                      <FormControl><Input placeholder="kg, pieces, tons" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="minOrder" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Minimum Order</FormLabel>
                      <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div>
                  <FileUploader
                    label="Product Image"
                    description="Upload a product image. Recommended size: 600x400px (JPG/JPEG, max 5MB)"
                    value={form.watch('imageUrl') || ''}
                    onChange={(url) => form.setValue('imageUrl', url, { shouldDirty: true })}
                    validationOptions={{ ...DEFAULT_IMAGE_OPTIONS, maxSize: 5 * 1024 * 1024 }}
                    accept="image/jpeg,image/jpg,image/webp"
                  />
                  {form.formState.errors.imageUrl && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.imageUrl.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Adding Product...' : 'Add Product'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

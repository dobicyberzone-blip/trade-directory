'use client';

import Link from "next/link";
import { Mail, Phone, Send, MapPin,Facebook, Linkedin, Youtube, Instagram } from "lucide-react";
import * as z from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Logo } from "../logo";

// A modern 'X' icon for Twitter
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );

const quickLinks = [
    { name: "About KEPROBA", href: "/about" },
    { name: "E-Directory", href: "/directory" },
    { name: "Contact Us", href: "/contact" },
];

const forYouLinks = [
    { name: "For Exporters", href: "/register" },
    { name: "For Buyers", href: "/directory" },
    { name: "FAQs", href: "/faq" },
]


const contactInfo = [
    { 
        icon: MapPin, 
        content: "1st and 16th Floor Anniversary Towers, University Way\nP.O. Box 40247 00100 GPO\nNairobi, Kenya",
        lines: 3
    },
    { 
        icon: Phone, 
        content: "Tel. +254 20 222 85 34 8\nCell: +254 722 205 875 254 734 228 534\nFax: +254 20 222 85 39 or 221 80 13",
        lines: 3
    },

]

const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

function NewsletterForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof newsletterSchema>>({
        resolver: zodResolver(newsletterSchema),
        defaultValues: { email: '' },
    });

    async function onSubmit(values: z.infer<typeof newsletterSchema>) {
        setIsSubmitting(true);
        try {
            const result = await subscribeToNewsletter(values.email);
            if (result.success) {
                toast({
                    title: "Subscribed!",
                    description: "Thank you for subscribing to our newsletter.",
                });
                form.reset();
            } else {
                toast({
                    variant: 'destructive',
                    title: "Subscription Failed",
                    description: result.error,
                });
            }
        } catch (error) {

            toast({
                variant: 'destructive',
                title: "Subscription Failed",
                description: "An unexpected error occurred. Please try again later.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full max-w-sm items-start space-x-2">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormControl>
                                <Input 
                                    className="bg-footer border-footer-foreground/50 placeholder:text-footer-foreground/60 h-11"
                                    type="email" 
                                    placeholder="Your email address" 
                                    {...field} />
                            </FormControl>
                            <FormMessage className="text-destructive text-xs mt-1" />
                        </FormItem>
                    )}
                />
                <Button type="submit" variant="default" size="icon" className="h-11 w-11 flex-shrink-0" disabled={isSubmitting}>
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </Form>
    )
}

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Logo + Description + Social + Contact */}
            <div className="lg:col-span-2 space-y-4">
                <Logo size="small" isLight={true} priority variant="footer" />
                <p className="text-sm text-footer-foreground/80 pr-8">
                    The Kenya Export Promotion and Branding Agency (KEPROBA) is the official government body for promoting Kenyan exports to the world.
                </p>
                {/* Social links */}
                <div className="flex space-x-4 pt-1">
                    <Link href="https://web.facebook.com/MakeItKenya" aria-label="Facebook">
                      <Facebook className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors"/>
                    </Link>
                    <Link href="https://twitter.com/MakeItKenya" aria-label="X (Twitter)">
                      <XIcon className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors"/>
                    </Link>
                    <Link href="https://www.linkedin.com/company/keproba" aria-label="LinkedIn">
                      <Linkedin className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors"/>
                    </Link>
                    <Link href="https://www.instagram.com/makeitkenya/" aria-label="Instagram">
                      <Instagram className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors"/>
                    </Link>
                    <Link href="https://www.youtube.com/c/MakeitKenya-BrandKenya" aria-label="YouTube">
                      <Youtube className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors"/>
                    </Link>
                </div>
                {/* Contact info */}
                <div className="space-y-4 pt-2">
                  {contactInfo.map((item, index) => {
                    const Icon = item.icon;
                    const lines = item.content.split('\n');
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <Icon className="h-5 w-5 text-footer-foreground/80 mt-1 flex-shrink-0" />
                        <div className="text-sm text-footer-foreground/80">
                          {lines.map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
            
            <div className="space-y-4">
                <h4 className="font-bold text-base text-white">Platform</h4>
                 <ul className="space-y-2 text-sm">
                     {quickLinks.map(link => (
                         <li key={link.name}>
                             <Link href={link.href} className="hover:underline text-footer-foreground/80 hover:text-white transition-colors">
                                 {link.name}
                             </Link>
                         </li>
                     ))}
                 </ul>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-base text-white">Get Started</h4>
                 <ul className="space-y-2 text-sm">
                     {forYouLinks.map(link => (
                         <li key={link.name}>
                             <Link href={link.href} className="hover:underline text-footer-foreground/80 hover:text-white transition-colors">
                                 {link.name}
                             </Link>
                         </li>
                     ))}
                 </ul>
            </div>

             <div className="space-y-4">
                <h4 className="font-bold text-base text-white">Newsletter</h4>
                <p className="text-sm text-footer-foreground/80">Get the latest on trade policies, market opportunities, and featured exporters.</p>
                <NewsletterForm />
             </div>
        </div>
      </div>
      <div className="bg-black/20">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center text-xs text-white/90">
            <p suppressHydrationWarning>© {currentYear || 2024} KEPROBA. All Rights Reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0 flex-wrap justify-center">
                <Link href="/privacy-policy" className="hover:underline hover:text-white transition-colors text-white/90">Privacy Policy</Link>
                <Link href="/terms-and-conditions" className="hover:underline hover:text-white transition-colors text-white/90">Terms & Conditions</Link>
                <Link href="/legal" className="hover:underline hover:text-white transition-colors text-white/90">Legal</Link>
                <Link href="https://www.eiti.tech/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors text-white/90">Website Developer</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}

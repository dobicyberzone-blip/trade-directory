'use client';

import Link from "next/link";
import { Mail, Phone, Send, MapPin, Facebook, Linkedin, Youtube, Instagram } from "lucide-react";
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

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const usefulLinks = [
  { name: "Kenya Association of Manufacturers (KAM)", href: "https://www.kam.co.ke" },
  { name: "Kenya National Chamber of Commerce and Industry (KNCCI)", href: "https://www.kenyachamber.or.ke" },
  { name: "Kenya Trade Network Agency", href: "https://www.kentrade.go.ke" },
  { name: "Info Trade Kenya", href: "https://www.infotradekenya.go.ke" },
  { name: "Kenya Trade Portal", href: "https://www.kenyatradeportal.go.ke" },
  { name: "ICT Authority", href: "https://www.icta.go.ke" },
  { name: "Access to EU Market", href: "https://www.accesstomarkets.org" },
];

const platformLinks = [
  { name: "About KEPROBA", href: "/about" },
  { name: "E-Directory", href: "/directory" },
  { name: "Contact Us", href: "/contact" },
];

const getStartedLinks = [
  { name: "For Exporters", href: "/register" },
  { name: "For Buyers", href: "/directory" },
  { name: "FAQs", href: "/faq" },
];

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
        toast({ title: "Subscribed!", description: "Thank you for subscribing to our newsletter." });
        form.reset();
      } else {
        toast({ variant: 'destructive', title: "Subscription Failed", description: result.error });
      }
    } catch {
      toast({ variant: 'destructive', title: "Subscription Failed", description: "An unexpected error occurred. Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full max-w-sm items-start space-x-2">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input className="bg-footer border-footer-foreground/50 placeholder:text-footer-foreground/60 h-11" type="email" placeholder="Your email address" {...field} />
            </FormControl>
            <FormMessage className="text-destructive text-xs mt-1" />
          </FormItem>
        )} />
        <Button type="submit" variant="default" size="icon" className="h-11 w-11 flex-shrink-0" disabled={isSubmitting}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </Form>
  );
}

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  useEffect(() => { setCurrentYear(new Date().getFullYear()); }, []);

  return (
    <footer className="bg-footer text-footer-foreground">

      {/* ── TOP SECTION: Logo/Contact  |  Useful Links ── */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left: Logo + description + contact */}
          <div className="space-y-5">
            <Logo />
            <p className="text-sm text-footer-foreground/80 max-w-sm">
              The Kenya Export Promotion and Branding Agency (KEPROBA) is the official government body for promoting Kenyan exports to the world.
            </p>
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-footer-foreground/70 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-footer-foreground/80 leading-relaxed">
                  1st and 16th Floor Anniversary Towers, University Way<br />
                  P.O. Box 40247 00100 GPO<br />
                  Nairobi, Kenya
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-footer-foreground/70 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-footer-foreground/80 leading-relaxed">
                  Tel. +254 20 222 85 34 8<br />
                  Cell: +254 722 205 875 254 734 228 534<br />
                  Fax: +254 20 222 85 39 or 221 80 13
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-footer-foreground/70 mt-0.5 flex-shrink-0" />
                <a href="mailto:chiefexe@brand.ke" className="text-sm text-footer-foreground/80 hover:text-white transition-colors">
                  chiefexe@brand.ke
                </a>
              </div>
            </div>
          </div>

          {/* Right: Useful Links — two columns */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-white">Useful Links</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {usefulLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-footer-foreground/80 hover:text-white hover:underline transition-colors leading-snug"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="border-t border-white/10" />

      {/* ── BOTTOM SECTION: Social | Platform | Get Started | Newsletter ── */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Social icons */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Link href="https://web.facebook.com/MakeItKenya" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors" />
              </Link>
              <Link href="https://twitter.com/MakeItKenya" aria-label="X (Twitter)">
                <XIcon className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors" />
              </Link>
              <Link href="https://www.linkedin.com/company/keproba" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors" />
              </Link>
              <Link href="https://www.instagram.com/makeitkenya/" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors" />
              </Link>
              <Link href="https://www.youtube.com/c/MakeitKenya-BrandKenya" aria-label="YouTube">
                <Youtube className="h-5 w-5 text-footer-foreground/80 hover:text-white transition-colors" />
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-white">Platform</h4>
            <ul className="space-y-2 text-sm">
              {platformLinks.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-footer-foreground/80 hover:text-white hover:underline transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Started */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-white">Get Started</h4>
            <ul className="space-y-2 text-sm">
              {getStartedLinks.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-footer-foreground/80 hover:text-white hover:underline transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-white">Newsletter</h4>
            <p className="text-sm text-footer-foreground/80">Get the latest on trade policies, market opportunities, and featured exporters.</p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ── COPYRIGHT BAR ── */}
      <div className="bg-black/20">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center text-xs text-white/90 gap-3">
          <p suppressHydrationWarning>© {currentYear || 2026} KEPROBA. All Rights Reserved.</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/privacy-policy" className="hover:underline hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:underline hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="/legal" className="hover:underline hover:text-white transition-colors">Legal</Link>
            <Link href="https://www.eiti.tech/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors">Website Developer</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}

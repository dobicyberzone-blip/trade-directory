import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Users, Building, Globe, Shield, Phone } from 'lucide-react';

const faqCategories = [
  {
    title: "Getting Started",
    icon: HelpCircle,
    faqs: [
      {
        question: "What is the KEPROBA Trade Directory?",
        answer: "The KEPROBA Trade Directory is Kenya's official digital platform for connecting verified Kenyan exporters with international buyers. It serves as a comprehensive database of certified businesses, products, and services available for export from Kenya."
      },
      {
        question: "How do I create an account?",
        answer: "Click the 'Register' button on our homepage and choose your account type (Exporter or Buyer). Fill in the required information, verify your email address, and complete the registration process. Exporters will need to undergo additional verification to be listed in the directory."
      },
      {
        question: "Is the platform free to use?",
        answer: "Yes, the KEPROBA Trade Directory is completely free for both exporters and buyers. This is part of our mission to promote Kenyan exports and facilitate international trade connections."
      },
      {
        question: "What types of businesses can join?",
        answer: "We welcome Kenyan exporters from all sectors including agriculture, manufacturing, textiles, technology, services, and more. International buyers and importers looking for Kenyan products and services are also encouraged to join."
      }
    ]
  },
  {
    title: "For Exporters",
    icon: Building,
    faqs: [
      {
        question: "How do I get verified as an exporter?",
        answer: "After registering, complete your business profile with accurate information. Submit required documents including business registration, export licenses, and certifications. Our verification team will review your application and notify you of the status within 5-10 business days."
      },
      {
        question: "What documents do I need for verification?",
        answer: "Required documents include: Business registration certificate, Export license, Tax compliance certificate, Product certifications (if applicable), and Bank reference letter. Additional documents may be requested based on your business type."
      },
      {
        question: "How do I add products to my profile?",
        answer: "Once verified, log into your dashboard and navigate to 'Add Product'. Provide detailed product information, high-quality images, specifications, and pricing. Ensure all information is accurate as it will be visible to potential buyers worldwide."
      },
      {
        question: "Can I update my business information?",
        answer: "Yes, you can update your business profile, contact information, and product listings at any time through your dashboard. Major changes may require re-verification to maintain your verified status."
      },
      {
        question: "How do buyers contact me?",
        answer: "Buyers can contact you through the platform's messaging system or using the contact information in your profile. You'll receive email notifications for new inquiries and can respond directly through the platform."
      }
    ]
  },
  {
    title: "For Buyers",
    icon: Users,
    faqs: [
      {
        question: "How do I find suppliers on the platform?",
        answer: "Use our search function to find exporters by product, industry, or location. Browse the directory by categories or use advanced filters to narrow down results. You can filter by verification status to find verified exporters who have completed KEPROBA's authentication process and display a verified badge."
      },
      {
        question: "How do I contact exporters?",
        answer: "Click on any exporter's profile and use the 'Contact' or 'Send Inquiry' button. You can send direct messages through the platform or use the provided contact information to reach them directly."
      },
      {
        question: "Are all exporters verified?",
        answer: "Not all exporters listed in our directory are verified. Exporters must submit all required documents including business registration, export licenses, and certifications to undergo KEPROBA's verification process. Once verified, exporters receive a 'Verified' badge displayed on their profile, indicating they have completed document verification, business validation, and quality checks to ensure they are legitimate Kenyan exporters. Look for the verified badge when browsing exporters."
      },
      {
        question: "Can I request quotes from multiple suppliers?",
        answer: "Absolutely! You can contact multiple exporters for quotes and compare their offerings. We encourage buyers to evaluate multiple options to find the best fit for their requirements."
      },
      {
        question: "Is there support for international transactions?",
        answer: "While we facilitate connections, actual transactions are conducted directly between buyers and exporters. We can provide guidance on Kenyan export procedures and connect you with relevant trade support services."
      }
    ]
  },
  {
    title: "Platform Features",
    icon: Globe,
    faqs: [
      {
        question: "What is the map feature?",
        answer: "Our interactive map shows the geographical distribution of exporters across Kenya. You can view exporters by location, see their business details, and understand the regional strengths of different industries. Verified exporters are marked with a verified badge."
      },
      {
        question: "How does the search function work?",
        answer: "Our advanced search allows you to find exporters by keywords, product categories, industry sectors, location, certifications, and more. Use filters to refine results and find exactly what you're looking for."
      },
      {
        question: "Can I save favorite exporters?",
        answer: "Yes, you can bookmark exporters and products of interest. This feature helps you keep track of potential suppliers and easily return to their profiles later."
      },
      {
        question: "Is the platform available in multiple languages?",
        answer: "Currently, the platform is available in English. We're working on adding more languages to better serve our international user base."
      },
      {
        question: "Can I access the platform on mobile devices?",
        answer: "Yes, our platform is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. You can access all features from any device with an internet connection."
      }
    ]
  },
  {
    title: "Security & Privacy",
    icon: Shield,
    faqs: [
      {
        question: "How is my data protected?",
        answer: "We implement industry-standard security measures including data encryption, secure servers, and regular security audits. Your personal information is protected according to our Privacy Policy and Kenyan data protection laws."
      },
      {
        question: "Who can see my business information?",
        answer: "Verified business information is publicly visible to promote your exports globally. Personal contact details are only shared with registered users who express genuine interest in your products or services."
      },
      {
        question: "Can I control what information is displayed?",
        answer: "Yes, you have control over your business profile information. You can choose what details to display publicly while keeping sensitive information private or sharing it only with qualified inquiries."
      },
      {
        question: "How do you prevent fraud?",
        answer: "We have a comprehensive verification process, monitor platform activity, and investigate reported issues. Users can report suspicious activity, and we take immediate action against fraudulent accounts."
      }
    ]
  },
  {
    title: "Support & Assistance",
    icon: Phone,
    faqs: [
      {
        question: "How can I get help with my account?",
        answer: "Contact our support team through the Contact page, email us at support@keproba.go.ke, or call +254 20 222 85 34 8. We provide assistance with account setup, verification, and platform usage."
      },
      {
        question: "Do you provide export training or guidance?",
        answer: "Yes, KEPROBA offers various export development programs, training workshops, and market intelligence services. Contact us to learn about current programs and how to participate."
      },
      {
        question: "Can you help with trade documentation?",
        answer: "We provide guidance on export procedures and can connect you with relevant government agencies and service providers who assist with trade documentation and compliance."
      },
      {
        question: "Do you organize trade missions or exhibitions?",
        answer: "Yes, KEPROBA regularly organizes trade missions, exhibitions, and buyer-seller meetings. Verified exporters are invited to participate in these events to expand their international reach."
      },
      {
        question: "How can I report a problem or provide feedback?",
        answer: "Use our Contact form, email us directly, or call our support line. We welcome feedback and continuously work to improve our platform based on user suggestions and needs."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Find answers to common questions about using the KEPROBA Trade Directory platform.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {faqCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {category.faqs.length} questions answered
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="space-y-8">
              {faqCategories.map((category, categoryIndex) => {
                const Icon = category.icon;
                return (
                  <div key={categoryIndex}>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Icon className="h-5 w-5 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                    </div>
                    
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.faqs.map((faq, faqIndex) => (
                        <AccordionItem 
                          key={faqIndex} 
                          value={`${categoryIndex}-${faqIndex}`}
                          className="border border-gray-200 rounded-lg px-6"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium text-gray-900">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 text-gray-600 leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>

            {/* Contact Section */}
            <Card className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    User Guides
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Step-by-step guides to help you get the most out of the KEPROBA Trade Directory platform.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                    href="https://scribehow.com/viewer/KEPROBA_TRADE_DIRECTORY_USER_GUIDE__PsVhuhWUTB-vvmDBU-1O_g" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-green-600">Exporter User Guide</p>
                        <p className="text-sm text-gray-500">Complete guide for exporters</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a 
                    href="https://scribehow.com/viewer/How_to_Navigate_and_Utilize_the_KEPROBA_Online_Trade_Directory_Buyer_User_Guide__3gLURyWBRBSExXNY-X8Zaw" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-green-600">Buyer User Guide</p>
                        <p className="text-sm text-gray-500">Guide for international buyers</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="mt-12 bg-green-50 border-green-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-6">
                  Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/contact" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Contact Support
                  </a>
                  <a 
                    href="mailto:support@keproba.go.ke" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Email Us
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function LegalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 sm:pt-32 lg:pt-36">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-primary mb-8">Legal Information</h1>
            <div className="prose lg:prose-xl max-w-none text-foreground space-y-8">
                
                <section>
                    <h2 className="text-2xl font-semibold text-foreground">Our Mandate</h2>
                    <p>The Kenya Export Promotion and Branding Agency is a State Corporation established under the State Corporations Act Cap 446 through Legal Notice No.110 of August 9th, 2019 after the merger of the Export Promotion Council and Brand Kenya Board. The Agency&apos;s mandate is to implement export promotion and nation branding initiatives and policies to promote Kenya’s export of goods and services.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground">Our Functions</h2>
                    <p>Under Paragraph (4) of the executive order, the functions of the Agency shall be;</p>
                    <ul className="space-y-4 list-disc pl-6">
                        <li>To Advocate, Coordinate, Harmonize And Implement Export Promotion And Nation Branding Initiatives And Policies To Promote Kenyan Goods And Services In Export Markets.</li>
                        <li>To Collect, Collate, Disseminate And Serve As A Repository Of Trade And Kenya Brand Information;</li>
                        <li>To Provide Nation Branding Guidelines For Stakeholders’ Initiatives Including Kenya Missions Abroad;</li>
                        <li>To Advocate, Promote And Facilitate The Development And Diversification Of Kenya’s Export Trade;</li>
                        <li>To Promote And Brand Kenyan Exports Through Knowledge-Based Support And Information To Exporters And Producers Including Export Procedures And Documentation, Market Entry Requirements, And Marketing Techniques;</li>
                        <li>To Encourage And Monitor The Observance Of International Standards And Specifications By Exporters;</li>
                        <li>To Provide Cooperation To The Export Inspection Agencies On Quality Control And Preshipment Inspection Of Export Products To Ensure Observance Of International Standards And Specifications;</li>
                        <li>To Promote And Brand Kenya As A Supplier Of High-Quality Goods And Services;</li>
                        <li>To Ensure The Harmonised Application Of The National Mark Of Identity For Kenyan Goods And Services;</li>
                        <li>To Formulate And Implement Strategies For Improved Balance Of Trade, Foreign Exchange Earnings And Retention;</li>
                        <li>To Offer Advice To Kenyan Exporters Including In Technology Upgrading, Quality And Design Improvement, Standards And Product Development, And Innovation;</li>
                        <li>To Provide Export Assistance Services, Such As Distribution Of Trade-Related Information To Exporters, Foreign Country Market Research, And Counselling To Exporters;</li>
                        <li>To Co-Ordinate Kenya’s Participation In Trade Promotion Events Including Trade Fairs And Buyer-Seller Meets;</li>
                        <li>To Provide Market Intelligence Through Research, Analysis And Monitoring Of Trends And Opportunities In International Markets That Kenyan Exporters Can Take Advantage Of To Increase Or Diversify Exports;</li>
                        <li>To Provide Kenyans With Positive Information About Kenya In Order To Promote National Unity, Patriotism And National Pride;</li>
                        <li>To Establish An Integrated Approach Within Government And Private Sector Towards International Marketing And Branding Of Kenya;</li>
                        <li>To Build National Support For The Nation Brand With Other Government Agencies, Non-Governmental Organizations And The Private Sector;</li>
                        <li>To Provide Customised Advisory Services; And To Do Any Other Thing Necessary Or Expedient For The Discharge Of Its Functions Under This Order.</li>
                    </ul>
                </section>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

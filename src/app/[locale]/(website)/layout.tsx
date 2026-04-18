import { Navbar } from "@/components/website/Navbar";
import { Footer } from "@/components/website/Footer";
import { WhatsAppWidget } from "@/components/website/WhatsAppWidget";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppWidget />
    </>
  );
}

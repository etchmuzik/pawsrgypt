import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Phone, Mail, Star, Award, Users, PawPrint } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("about");
  const locale = useLocale();

  const values = [
    { icon: Heart, title: "Pet First", titleAr: "الحيوان أولاً", desc: "Every decision we make starts with your pet's wellbeing." },
    { icon: Star, title: "Premium Quality", titleAr: "جودة متميزة", desc: "We only stock products we'd use for our own pets." },
    { icon: Award, title: "Expert Care", titleAr: "رعاية متخصصة", desc: "Our groomers are certified and passionate about animals." },
    { icon: Users, title: "Community", titleAr: "مجتمع", desc: "Building Cairo's best community of pet owners." },
  ];

  const branches = [
    { name: "New Cairo", nameAr: "القاهرة الجديدة", address: "5th Settlement, New Cairo" },
    { name: "Sheikh Zayed", nameAr: "الشيخ زايد", address: "Beverly Hills, Sheikh Zayed" },
    { name: "Maadi", nameAr: "المعادي", address: "Road 9, Maadi" },
    { name: "Zamalek", nameAr: "الزمالك", address: "26th July Corridor, Zamalek" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("title")}</h1>
        <p className="text-neutral-400 text-lg">Cairo&apos;s Premium Pet Lifestyle Brand</p>
      </div>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
              {t("mission_title")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t("mission_text")}
            </p>
            <div className="mt-6">
              <Link href={`/${locale}/shop`}>
                <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
                  Shop Our Products
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-neutral-50 rounded-full flex items-center justify-center">
              <PawPrint className="w-32 h-32 text-paws-orange" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-10 text-center">
            {t("values_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-paws-orange/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-paws-orange" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-2">
                  {locale === "ar" ? v.titleAr : v.title}
                </h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-10 text-center">
            Our Locations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="border border-neutral-200 rounded-2xl p-5 hover:border-paws-orange transition-colors"
              >
                <MapPin className="w-6 h-6 text-paws-orange mb-3" />
                <h3 className="font-bold text-neutral-900">
                  {locale === "ar" ? branch.nameAr : branch.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{branch.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-md mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">{t("contact_title")}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-neutral-600">
              <Phone className="w-5 h-5 text-paws-orange" />
              <span>+20 100 000 0000</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-neutral-600">
              <Mail className="w-5 h-5 text-paws-orange" />
              <span>hello@pawsegypt.com</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

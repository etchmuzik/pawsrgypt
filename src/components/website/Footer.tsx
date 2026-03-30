import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="bg-paws-brown-dark text-paws-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-paws-orange rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-lg text-white">PAWS Egypt</span>
            </div>
            <p className="text-paws-sand text-sm mb-4">{t("tagline")}</p>
            <div className="flex gap-3">
              <a href="#" className="text-paws-sand hover:text-paws-orange transition-colors text-sm flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Facebook
              </a>
              <a href="#" className="text-paws-sand hover:text-paws-orange transition-colors text-sm flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Instagram
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-white mb-3">{t("shop")}</h4>
            <ul className="space-y-2">
              {["Food & Treats", "Accessories", "Grooming", "Toys"].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/${locale}/shop`}
                    className="text-sm text-paws-sand hover:text-paws-orange transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3">{t("company")}</h4>
            <ul className="space-y-2 text-sm text-paws-sand">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-paws-orange shrink-0" />
                <span>+20 100 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-paws-orange shrink-0" />
                <span>hello@pawsegypt.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-paws-orange shrink-0 mt-0.5" />
                <span>Cairo, Egypt</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-paws-brown mt-8 pt-6 text-center text-xs text-paws-sand">
          © {new Date().getFullYear()} PAWS Egypt. {t("rights")}.
        </div>
      </div>
    </footer>
  );
}

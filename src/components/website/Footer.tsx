import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { PawLogo } from "@/components/website/PawLogo";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-2">
            <div className="mb-4">
              <PawLogo />
            </div>
            <p className="text-neutral-400 text-sm mb-4">{t("tagline")}</p>
            <div className="flex gap-3">
              <a href="https://facebook.com/pawsegypt" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-paws-orange transition-colors text-sm flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Facebook
              </a>
              <a href="https://instagram.com/pawsegypt" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-paws-orange transition-colors text-sm flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Instagram
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-white mb-3">{t("shop")}</h4>
            <ul className="space-y-2">
              {["Food & Treats", "Accessories", "Toys", "Health"].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/${locale}/shop`}
                    className="text-sm text-neutral-400 hover:text-paws-orange transition-colors"
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
            <ul className="space-y-2 text-sm text-neutral-400">
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

        <div className="border-t border-neutral-800 mt-8 pt-6 text-center text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} PAWS Egypt. {t("rights")}.
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useLocale } from "next-intl";

const PHONE = "201005285753";

export function WhatsAppWidget() {
  const locale = useLocale();
  const message =
    locale === "ar"
      ? "مرحبا! أود الاستفسار عن منتجات PAWS Egypt."
      : "Hi! I'd like to ask about PAWS Egypt products.";
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  const label = locale === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 end-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-current"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.593-.832-2.85-.14-.361-.4-.404-.786-.404-.066 0-.133-.01-.2-.01-.246 0-.48.067-.692.19-.693.403-1.08 1.156-1.08 1.95 0 .287.046.582.14.86.26.786.655 1.54 1.075 2.28 1.2 2.066 2.782 3.74 4.953 4.842.57.29 1.17.565 1.76.81.28.115.573.214.86.295.51.144 1.03.26 1.56.26.78 0 1.47-.37 1.86-1.07.27-.47.375-1.01.375-1.55 0-.23-.08-.44-.28-.56-.78-.47-1.78-.99-1.875-.99zM16 4C9.373 4 4 9.373 4 16c0 2.124.558 4.205 1.617 6.045L4 28l6.13-1.61A11.94 11.94 0 0 0 16 28c6.627 0 12-5.373 12-12S22.627 4 16 4zm0 21.816a9.81 9.81 0 0 1-5.008-1.371l-.36-.213-3.739.98 1-3.65-.235-.374a9.816 9.816 0 1 1 8.342 4.628z" />
      </svg>
    </a>
  );
}

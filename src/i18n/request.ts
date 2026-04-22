import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

type Locale = "en" | "ar";

const MESSAGES: Record<Locale, typeof en> = {
  en,
  ar: ar as typeof en,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = requested && routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : (routing.defaultLocale as Locale);

  return {
    locale,
    messages: MESSAGES[locale],
  };
});

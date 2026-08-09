import type { AppLocale } from "../../shared/ui-locale";

export { APP_LOCALES, DEFAULT_LOCALE, coerceLocale } from "../../shared/ui-locale";
export type { AppLocale } from "../../shared/ui-locale";

/** English remains the source catalog when a translated key is missing. */
export const FALLBACK_LOCALE: AppLocale = "en";

/** Value for `document.documentElement.lang`. */
export function documentLang(locale: AppLocale): string {
	return locale;
}

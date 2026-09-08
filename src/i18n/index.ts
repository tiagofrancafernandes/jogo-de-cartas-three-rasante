import { SupportedLocale, Translations, translations } from './translations';

const STORAGE_KEY_LOCALE = 'rasante_language';
const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';

type LocaleChangeListener = (locale: SupportedLocale, t: Translations) => void;

export class I18nManager {
    private currentLocale: SupportedLocale;
    private listeners: Set<LocaleChangeListener> = new Set();

    public constructor() {
        this.currentLocale = this.detectInitialLocale();
    }

    public getLocale(): SupportedLocale {
        return this.currentLocale;
    }

    public setLocale(locale: SupportedLocale): void {
        if (this.currentLocale === locale) {
            return;
        }

        this.currentLocale = locale;
        this.persistLocale(locale);
        this.notifyListeners();
    }

    public toggleLocale(): SupportedLocale {
        const nextLocale: SupportedLocale = this.currentLocale === 'pt-BR' ? 'en-US' : 'pt-BR';
        this.setLocale(nextLocale);
        return nextLocale;
    }

    public t(): Translations {
        return translations[this.currentLocale];
    }

    public subscribe(listener: LocaleChangeListener): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners(): void {
        const activeTranslations = this.t();

        for (const listener of this.listeners) {
            listener(this.currentLocale, activeTranslations);
        }
    }

    private detectInitialLocale(): SupportedLocale {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedLocale = window.localStorage.getItem(STORAGE_KEY_LOCALE) as SupportedLocale | null;

            if (savedLocale === 'pt-BR' || savedLocale === 'en-US') {
                return savedLocale;
            }

            if (navigator.language && navigator.language.toLowerCase().startsWith('pt')) {
                return 'pt-BR';
            }

            if (navigator.language && navigator.language.toLowerCase().startsWith('en')) {
                return 'en-US';
            }
        }

        return DEFAULT_LOCALE;
    }

    private persistLocale(locale: SupportedLocale): void {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }

        window.localStorage.setItem(STORAGE_KEY_LOCALE, locale);
    }
}

export const i18n = new I18nManager();

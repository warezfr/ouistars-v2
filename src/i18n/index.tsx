import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fr } from './fr';
import { en } from './en';
import { es } from './es';
import { ru } from './ru';
import { ar } from './ar';

export type Lang = 'fr' | 'en' | 'es' | 'ru' | 'ar';
export type Dict = typeof fr;

const DICTS: Record<Lang, Dict> = { fr, en, es, ru, ar };

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
];

/** Chaîne localisée hors dictionnaire (contenus riches : routes, destinations…). */
export type L5 = Record<Lang, string>;
export const pickL = (lang: Lang, v: L5): string => v[lang] ?? v.en;

interface I18nCtx {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE_KEY = 'os-lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in DICTS) return saved;
    const nav = navigator.language?.slice(0, 2) as Lang;
    if (nav && nav in DICTS) return nav;
  } catch { /* SSR / stockage refusé */ }
  return 'fr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* navigation privée */ }
  };

  // Langue + sens d'écriture du document (arabe → RTL).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo<I18nCtx>(() => ({ lang, t: DICTS[lang], setLang }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

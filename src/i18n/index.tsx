import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { fr } from './fr';
import { en } from './en';

export type Lang = 'fr' | 'en';
export type Dict = typeof fr;

const DICTS: Record<Lang, Dict> = { fr, en };

interface I18nCtx {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');
  const value = useMemo<I18nCtx>(() => ({ lang, t: DICTS[lang], setLang }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

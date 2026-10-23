import { en } from './en';
import { kn } from './kn';
import { Language } from '../types';

export const translations = {
  en,
  kn,
};

export const getTranslation = (lang: Language) => {
  return translations[lang] || translations.en;
};

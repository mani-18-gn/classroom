import { en } from './en';
import { Language } from '../types';

export const translations = {
  en,
};

export const getTranslation = (_lang?: Language) => {
  return translations.en;
};

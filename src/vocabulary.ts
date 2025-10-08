import { createVocabulary } from 'rdf-vocabulary';

export const DELFOUR = createVocabulary(
  'http://localhost:3001/delfour/',
  'lessCarbs',
  'lessSugar',
);

export const EX = createVocabulary(
  'http://example.com/ns/',
  'seeLowCarbAlternatives',
  'seeLowSugarAlternatives',
);

// TODO: display some of these things to user somehow
export const SCHEMA = createVocabulary(
  'http://schema.org/',
  'name',
  'price'
);

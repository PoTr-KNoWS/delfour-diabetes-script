import { createVocabulary } from 'rdf-vocabulary';
import { rsDelfour } from './constants';

export const DELFOUR = createVocabulary(
  rsDelfour,
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

import { createVocabulary } from 'rdf-vocabulary';

export const DCTERMS = createVocabulary(
  'http://purl.org/dc/terms/',
  'issued'
);

export const DELFOUR = createVocabulary(
  'http://localhost:3001/delfour/',
  'lessCarbs',
  'lessSugar',
);

export const DPV = createVocabulary(
  'https://w3id.org/dpv#',
  'hasData',
  'hasDataSubject',
);

export const EX = createVocabulary(
  'https://example.org/ont/',
  'seeLowCarbAlternatives',
  'seeLowSugarAlternatives',
);

export const ODRL = createVocabulary(
  'http://www.w3.org/ns/odrl/2/',
  'hasPolicy'
);

export const RDF = createVocabulary(
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  'type',
);

// TODO: display some of these things to user somehow
export const SCHEMA = createVocabulary(
  'http://schema.org/',
  'name',
  'price'
);

export const TE = createVocabulary(
  'https://w3id.org/trustenvelope#',
  'DataProvenance',
  'PolicyProvenance',
  'TrustEnvelope',
  'provenance',
  'recipient',
  'rightsHolder',
  'sender',
  'sign',
);

export const XSD = createVocabulary(
  'http://www.w3.org/2001/XMLSchema#',
  'dateTime',
);

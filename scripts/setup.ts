import { NamedNode, Quad } from '@rdfjs/types';
import { DataFactory as DF, Writer } from 'n3';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  carbsPreferenceResource,
  chocolate,
  cookies, delfourId,
  lowSugarChocolate,
  lowSugarCookies, policyContainer, rubenId,
  sugarPreferenceResource
} from './constants';
import { performUmaRequest } from './uma-util';
import { DCTERMS, DELFOUR, DPV, EX, ODRL, RDF, TE, XSD } from './vocabulary';

// Adds dummy envelope data and stringifies everything as turtle
export async function wrapInEnvelope(data: Quad[], subject: NamedNode): Promise<string> {
  const quads = [ ...data ];
  const envelope = DF.namedNode('http://example.com/ns/envelope');
  const dataProv = DF.namedNode('http://example.com/ns/dataProvenance');
  const policyProv = DF.namedNode('http://example.com/ns/policyProvenance');

  const signedEnvelope = DF.namedNode('http://example.com/ns/signedEnvelope');
  const signedDataProv = DF.namedNode('http://example.com/ns/signedDataProvenance');
  const signedPolicyProv = DF.namedNode('http://example.com/ns/signedPolicyProvenance');

  quads.push(
    DF.quad(envelope, RDF.terms.type, TE.terms.TrustEnvelope),
    DF.quad(envelope, DCTERMS.terms.issued, DF.literal(new Date().toISOString(), XSD.terms.dateTime)),
    DF.quad(envelope, DPV.terms.hasData, subject),
    DF.quad(envelope, ODRL.terms.hasPolicy, DF.namedNode('http://example.com/policies/policy')),
    DF.quad(envelope, TE.terms.provenance, dataProv),
    DF.quad(envelope, TE.terms.provenance, policyProv),
    DF.quad(envelope, TE.terms.sign, signedEnvelope),
  );

  quads.push(
    DF.quad(dataProv, RDF.terms.type, TE.terms.DataProvenance),
    DF.quad(dataProv, DCTERMS.terms.issued, DF.literal(new Date().toISOString(), XSD.terms.dateTime)),
    DF.quad(dataProv, TE.terms.sender, DF.namedNode(rubenId)),
    DF.quad(dataProv, DPV.terms.hasDataSubject, subject),
    DF.quad(dataProv, TE.terms.sign, signedDataProv),
  );

  quads.push(
    DF.quad(policyProv, RDF.terms.type, TE.terms.PolicyProvenance),
    DF.quad(policyProv, DCTERMS.terms.issued, DF.literal(new Date().toISOString(), XSD.terms.dateTime)),
    DF.quad(policyProv, TE.terms.recipient, DF.namedNode(delfourId)),
    DF.quad(policyProv, TE.terms.rightsHolder, DF.namedNode(rubenId)),
    DF.quad(policyProv, TE.terms.sign, signedPolicyProv),
  );

  const writer = new Writer({
    prefixes: {
      dcterms: DCTERMS.namespace,
      dpv: DPV.namespace,
      te: TE.namespace,
      odrl: ODRL.namespace,
    }
  });
  writer.addQuads(quads);
  return new Promise((resolve, reject) => {
    writer.end((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function setup() {
  // Write policies to policy container
  await fetch(policyContainer, {
    method: 'POST',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/podPolicy.ttl'), 'utf8'),
  });
  await fetch(policyContainer, {
    method: 'POST',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/sugarPolicy.ttl'), 'utf8'),
  });
  await fetch(policyContainer, {
    method: 'POST',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/carbsPolicy.ttl'), 'utf8'),
  });

  // Write data to preferences
  const rubenNamedNode = DF.namedNode(rubenId);
  await performUmaRequest(sugarPreferenceResource, rubenId, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await wrapInEnvelope([ DF.quad(rubenNamedNode, EX.terms.seeLowSugarAlternatives, DF.literal('true')) ], rubenNamedNode),
  });
  await performUmaRequest(carbsPreferenceResource, rubenId, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await wrapInEnvelope([ DF.quad(rubenNamedNode, EX.terms.seeLowCarbAlternatives, DF.literal('true')) ], rubenNamedNode),
  });

  // Write products to Delfour RS
  await fetch(cookies, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body:`
@prefix delfour: <${DELFOUR.namespace}> .
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<${cookies}> a schema:Product ; 
  schema:name "Classic Tea Biscuits" ; 
  schema:sku "BIS-001" ; 
  schema:sugarContent "12.0"^^xsd:decimal ; 
  schema:price "2.10"^^xsd:decimal ;
  delfour:lessSugar <${lowSugarCookies}> .`
  });
  await fetch(lowSugarCookies, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body:`
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<${lowSugarCookies}> a schema:Product ; 
  schema:name "Low-Sugar Tea Biscuits" ; 
  schema:sku "BIS-101" ; 
  schema:sugarContent "3.0"^^xsd:decimal ; 
  schema:price "2.60"^^xsd:decimal .`
  });
  await fetch(chocolate, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body:`
@prefix delfour: <${DELFOUR.namespace}> .
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<${chocolate}> a schema:Product ; 
  schema:name "Milk Chocolate Bar" ; 
  schema:sku "CHOC-050" ; 
  schema:sugarContent "15.0"^^xsd:decimal ; 
  schema:price "1.80"^^xsd:decimal ;
  delfour:lessSugar <${lowSugarChocolate}> .`
  });
  await fetch(lowSugarChocolate, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body:`
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<${lowSugarChocolate}> a schema:Product ; 
  schema:name "85% Dark Chocolate" ; 
  schema:sku "CHOC-150" ; 
  schema:sugarContent "6.0"^^xsd:decimal ; 
  schema:price "2.20"^^xsd:decimal .`
  });
}

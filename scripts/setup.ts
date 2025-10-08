import { Quad } from '@rdfjs/types';
import { DataFactory as DF, Writer } from 'n3';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  carbsPreferenceResource,
  chocolate,
  cookies,
  lowSugarChocolate,
  lowSugarCookies,
  policyContainer,
  rubenId,
  sugarPreferenceResource
} from './constants';
import { performUmaRequest } from './uma-util';
import { DELFOUR, EX } from './vocabulary';

export async function setup() {
  // Write policies to policy container
  await fetch(path.posix.join(policyContainer, 'usagePolicyPod'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/podPolicy.ttl'), 'utf8'),
  });
  await fetch(path.posix.join(policyContainer, 'usagePolicyOwnerSugar'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/sugarPolicy.ttl'), 'utf8'),
  });
  await fetch(path.posix.join(policyContainer, 'usagePolicyDelfourSugar'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/sugarPolicyDelfour.ttl'), 'utf8'),
  });
  await fetch(path.posix.join(policyContainer, 'usagePolicyOwnerCarbs'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readFile(path.join(__dirname, '../assets/carbsPolicy.ttl'), 'utf8'),
  });

  // Write data to preferences
  const rubenNamedNode = DF.namedNode(rubenId);
  await performUmaRequest(sugarPreferenceResource, rubenId, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `<> <${EX.seeLowSugarAlternatives}> true .`,
  });
  await performUmaRequest(carbsPreferenceResource, rubenId, {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: `<> <${EX.seeLowCarbAlternatives}> true .`,
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

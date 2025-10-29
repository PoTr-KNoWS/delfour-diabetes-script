import { DataFactory as DF } from 'n3';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  carbsPreferenceResource,
  chocolate,
  cookies,
  joinUrl,
  lowSugarChocolate,
  lowSugarCookies,
  policyContainer,
  rsDelfour,
  rsRuben,
  rubenId,
  sugarPreferenceResource,
  uma
} from '../src/constants';
import { performUmaRequest } from '../src/uma-util';
import { DELFOUR, EX } from '../src/vocabulary';

async function readWithHosts(file: string): Promise<string> {
  const fullPath = path.join(__dirname, file);
  const content = await readFile(fullPath, 'utf8');
  return content
    .replaceAll('http://localhost:3001', rsDelfour)
    .replaceAll('http://localhost:3000', rsRuben)
    .replaceAll('http://localhost:4000/uma', uma);
}

export async function setup() {
  // Write policies to policy container
  await fetch(joinUrl(policyContainer, 'usagePolicyPod'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readWithHosts('../assets/podPolicy.ttl'),
  });
  await fetch(joinUrl(policyContainer, 'usagePolicyOwnerSugar'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readWithHosts('../assets/sugarPolicy.ttl'),
  });
  await fetch(joinUrl(policyContainer, 'usagePolicyDelfourSugar'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readWithHosts('../assets/sugarPolicyDelfour.ttl'),
  });
  await fetch(joinUrl(policyContainer, 'usagePolicyOwnerCarbs'), {
    method: 'PUT',
    headers: { 'content-type': 'text/turtle' },
    body: await readWithHosts('../assets/carbsPolicy.ttl'),
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
    body: `
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
    body: `
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
    body: `
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
    body: `
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
<${lowSugarChocolate}> a schema:Product ;
  schema:name "85% Dark Chocolate" ;
  schema:sku "CHOC-150" ;
  schema:sugarContent "6.0"^^xsd:decimal ;
  schema:price "2.20"^^xsd:decimal .`
  });
}

(async () => {
  await setup();
})();

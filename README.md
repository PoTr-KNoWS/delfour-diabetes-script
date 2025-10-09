# Delfour diabetes use case

This is a very initial implementation of the Delfour diabetes use case.
The idea was to see what was possible without having to change any of the server implementations.

To have the necessary server setup, execute the following steps:
- Clone the [UMA repository](https://github.com/SolidLabResearch/user-managed-access/).
  checkout the `delfour-sugar-use-case` tag,
  `yarn install`, and `yarn start:demo`. This will start the AS and RS of the user.
- Run a default config CSS instance on port 3001. E.g., by cloning and install the
  [CSS repository](https://github.com/CommunitySolidServer/CommunitySolidServer),
  and running `npm start -- -p 3001`.

For this repository, install with `npm install`.
The script in can then be run with `npm start`.

`eye` should also be available on your path.

[An example output can be found at the bottom of this document](#example-output),
if you just want to see the result and not to go through all this hassle.

A simple UI solution is also available.
First run `npm run setup` to initializes the servers with the necessary data.
Then run `npm run dev:ui` and go to <http://localhost:5173/>.

## v0.0.2

All the relevant changes and comments for v0.0.2 will be noted in this section.
The other sections were just slightly modified to match the current implementation.

Short summary of the changes:
- The scanner client sends a purpose claim when authenticating at the AS.
- The AS keeps track of the client claims when generating an access token.
- The AS exposes the above client claims through introspection of the corresponding token.
- The AS includes the relevant policies in the generated access token.
- The RS generates a (partial, as they are not signed) trust envelope
  based on all of the above data points (with very hacky code).
- The client script now stores the preferences in an internal record,
  and explicitly clears the data at the end of a run.
- The policies have been updates so there is only 1 per resource,
  and the root subject is `<>`, to make them dereferenceable.

Some implementation comments:
- The two new data points that are exchanged are the relevant policies, and the client claims.
  The first is done by including it in the access token, the second through introspection.
  It can be discussed what is the best way for either.
- Since the trust envelope is now generated on the RS,
  it suddenly needs to have a lot more knowledge about the inner workings of the authorization.
  An alternative would be that the AS generates it and provides it through an API to the RS so it just needs to append it,
  but one issue there is that the AS does not know the actual resource identifiers.
- It was not always clear to me what to exactly put in the trust envelope fields.
  - There are 3 different `dcterms:issued` dates, are these supposed to all be the same,
    and is it the same timestamp as the `iat` of the acces token?
  - Who is the `sender` of the trust envelope, the AS or the RS?
  - As recipient, I used the WebID claim of the client, but this might be too limiting.
  - I determine the `rightsHolder` as the owner(s) as stored in the RS.
    More correct might be to use the `assigner` fields of the relevant policies?
    But then the RS would have to interpret those policies.
  - The trust envelope spec does not have a predicate for "purpose" so I created a dummy one.
    I'm not sure if it makes sense to include details like that in the trust envelope.

## Script flow

This is a full description of how the flow currently works.
The script is assumed to be code that is running on the scanner.

Many of the choices here were made to get this script working quickly,
and with the existing server infrastructure.
Further below I discuss some of these choices and how they could be improved.

This is one specific flow, further below I discuss alternative flows that could be taken
but for which I didn't have time yet to implement these as well.

### 1. User picks up scanner

Nothing currently happens in this step.
An action that might make sense here is that the scanner contacts the Delfour server
to verify if the WebID of the user is allowed to unlock the scanner.
Think for example that the user scans a QR code, encoding their WebID, in the store next to the scanners.

### 2. Scanner checks user preferences

Once the user has "scanned" their WebID, the scanner determines the user preferences
to determine which alternatives need to be suggested.
How the scanner determines where to find these preferences is an unanswered question at the moment.
It uses the standard UMA flow to access the relevant resources,
in this case the user's preference for low sugar and carbs alternatives.
Due to the policies, the scanner only is allowed to read the former.
The data is returned in a trust envelope and the scanner stores the preferences

### 3. User scans product

When the user scans a product, the scanner contacts the Delfour server to acquire all information about this product,
including all different categories of alternatives.
The scanner then filters this result to only keep the relevant alternatives to show to the user.

### 4. User finishes shopping

The scanner generates a ticket and removes the stored preferences.
The scanner should probably also contact the Delfour server to log the transaction.

## Stubs

Many steps are hardcoded or insufficient, below some are detailed.

### Trust envelopes

This is a partial trust envelope, see the v0.0.2 section above for details.

### Parsing preferences

The trust envelope bodies should be parsed and interpreted correctly.
For now the script just checks if the turtle body has the string `true` in there somewhere.

### Scanner UMA interaction

The scanner has the WebID of Delfour hardcoded to send along using the unsafe authentication we have in UMA.
Ideally it would contact the Delfour server to acquire an ID token.

It also simply requests read permissions on the preference resources,
it does not yet include the purpose in this request.

### User preferences

The user's preference regarding sugar/carb alternatives are hardcoded.
These preferences should be determined using reasoning based on, for example, the user's diabetes status.
Specifically for the flow here,
this reasoning step should occur somehow on the user's RS.
For example, on the fly when requesting the preference resource,
or with a daily batch job that generates these resources.

### Policies

The current policies to regulate this scenario are quite simplistic:
they specifically give read access for the Delfour WebID to the two specific preference resources.
There are many ways in which this would need to be extended,
such as purposes, general policies for all stores and for specific stores, etc.

## Alternative flows

This is just one specific flow, with many things kept as simple as possible so this could be implemented in time.
Below I cover some alternatives and/or extra features, some of which were discussed beforehand.

### Determine specific alternatives server-side

The scanner could send the required alternatives to the Delfour server so only the relevant alternatives are sent back.

### More extensive preferences

The current preferences are simple true/false preferences.
More interesting would be to have preferences such as
"show me sugar-free alternatives if the product contains more than 10g sugar per serving/100g".
This would require the resource preferences to be more detailed,
as well as the Delfour item descriptions.

### Reasoning on scanner

The current flow required the Delfour server to determine the alternatives when requesting a resource.
This can become problematic if preferences become more advanced as described above.
It would no longer be possible to send all possible alternative combinations to the scanner.
One solution would be to send these preferences to the Delfour server per scan, as described above,
and perform reasoning there to determine the specific alternatives there.

Another solution would be that the scanner contains the entire database of Delfour products, including ingredients.
These could be acquired every time someone activates a scanner.
It could then perform reasoning locally to determine required alternatives,
and would no longer be required to contact the Delfour server for every scan.

### Preference discovery

One issue is how to discover where to acquire these preferences.
A solution could be that the scanner contacts the UMA server directly,
stating that it wants to access the concept of preferences, without having an exact resource URL.
The UMA server could then generate a token that the scanner can take to the RS to receive the required information,
without ever having known what the URL is of these resources.

### Let Delfour server handle communication

Currently, the scanner handles communication with the AS and RS of the user.
This could also be done by the Delfour server,
where it only sends the information the scanner requires back to it.

### User agent

There could be an additional server/client which pulls in all the relevant (meta-)data from all parties,
and then performs reasoning to determine the necessary steps.
E.g., if it has both the Delfour product catalog, and the user's personal data,
it can determine that diabetes implies that low-sugar alternatives need to be shown,
and determine what these are if it is informed by the scanner of a product being scanned,
depending on policies.

## Setup resources

These are the resources that are currently initialized when the script is run.

### Policies

The server is configured so all policies are read from the container `http://localhost:3000/settings/policies/`.
This is a public read/write container so we can easily and dynamically (and very unsafely)
add policies when the server is running.

The following policies are written to this container:
- A policy allowing the user to add resources to their own pod.
- Policies allowing the user to specifically modify their preferences.
- A policy allowing the Delfour WebID to read the user's sugar preferences.

### Preferences

As mentioned, the user's preferences are written as hardcoded resources,
including the trust envelope metadata.

### Delfour products

Four products are written to the Delfour RS, to simulate its product catalog.
These include the hardcoded alternatives pointing to low-sugar products.

## Example output
```
Activating scanner as http:/localhost:3000/123-456-789/profile/card#me
Determining user preferences

Sugar preference response
@prefix dcterms: <http://purl.org/dc/terms/>.
@prefix dpv: <https://w3id.org/dpv#>.
@prefix ex: <http://example.com/ns/>.
@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix te: <https://w3id.org/trustenvelope#>.

<> ex:seeLowSugarAlternatives true.
ex:envelope a te:TrustEnvelope;
    te:provenance ex:dataProvenance, ex:policyProvenance;
    te:sign ex:signedEnvelope.
ex:dataProvenance a te:DataProvenance;
    te:sign ex:signedDataProvenance.
ex:policyProvenance a te:PolicyProvenance;
    te:sign ex:signedPolicyProvenance;
    te:rightsHolder <../profile/card#me>.
ex:envelope dpv:hasData <>.
ex:dataProvenance dpv:hasDataSubject <>.
ex:envelope odrl:hasPolicy <../../settings/policies/usagePolicyDelfourSugar>.
ex:policyProvenance te:recipient <http://localhost:3001/delfour/profile/card#me>;
    te:TODO-purpose <urn:shopping:preferences>.

Access token [
  {
    "resource_id": "http://localhost:3000/ruben/preferences/sugar",
    "resource_scopes": [
      "urn:example:css:modes:read"
    ],
    "policies": [
      "http://localhost:3000/settings/policies/usagePolicyDelfourSugar"
    ]
  }
]
Policy http://localhost:3000/settings/policies/usagePolicyDelfourSugar :
@prefix ex: <http://example.org/1707120963224#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .

<> a odrl:Agreement ;
  odrl:permission ex:permissionDelfourSugar .
ex:permissionDelfourSugar a odrl:Permission ;
  odrl:action odrl:read ;
  odrl:target <http://localhost:3000/ruben/preferences/sugar> ;
  odrl:assignee <http://localhost:3001/delfour/profile/card#me> ;
  odrl:assigner <http://localhost:3000/123-456-789/profile/card#me> .


Carbs preference response
undefined

Scanner can show low sugar alternatives: true (undefined implies no permission to see)
Scanner can show low carbs alternatives: undefined (undefined implies no permission to see)
Storing preferences in local storage {
  'http:/localhost:3000/123-456-789/profile/card#me': { sugar: true, carbs: false }
}

Scanning http:/localhost:3001/delfour/products/BIS_001
{
  name: 'Classic Tea Biscuits',
  price: 2.1,
  lessSugar: [ 'http:/localhost:3001/delfour/products/BIS_101' ],
  lessCarbs: []
}

Removing cookies and scanning low-sugar alternative http:/localhost:3001/delfour/products/BIS_101
{
  name: 'Low-Sugar Tea Biscuits',
  price: 2.6,
  lessSugar: [],
  lessCarbs: []
}


Finished shopping, generating shopping ticket:

Ticket #123
For http:/localhost:3000/123-456-789/profile/card#me
At Tue Oct 07 2025 15:16:20 GMT+0200 (Central European Summer Time)
1x Low-Sugar Tea Biscuits: 2.6
Total: 2.6
Thank you for shopping at Delfour!


Removing preferences from local storage {}
```

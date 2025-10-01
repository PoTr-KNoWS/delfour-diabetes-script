# Delfour diabetes use case

This is a very initial implementation of the Delfour diabetes use case.
The idea was to see what was possible without having to change any of the server implementations.

3 servers are currently required:
- A UMA server at `http://localhost:4000/` with a way to dynamically add policies.
- A resource server at `http://localhost:3000/` with a pod for account `ruben`.
- A resource server at `http://localhost:3001/` with public read/write access for everything.

The first two can be accomplished by cloning/installing
the [UMA repository](https://github.com/SolidLabResearch/user-managed-access/)
and running `yarn start:demo`.
The last server can be done by starting a standard CSS instance with extra parameter `-p 3001`.

Install dependencies here with `npm install`.
The script in this repo can then be run with `npm start`.

`eye` should also be available on your path.

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
The data is returned in a trust envelope.

### 3. User scans product

When the user scans a product, the scanner contacts the Delfour server to acquire all information about this product,
including all different categories of alternatives.
The scanner then filters this result to only keep the relevant alternatives to show to the user.

### 4. User finishes shopping

At this point, the scanner just generates a ticket here.
The scanner should forget the preferences at this point.
The scanner should probably also contact the Delfour server to log the transaction.

## Stubs

Many steps are hardcoded or insufficient, below some are detailed.

### Trust envelopes

The server does not return trust envelopes.
These are hardcoded triples added to the resources during setup to simulate these.

### Parsing preferences

The trust envelope bodies should be parsed and interpreted correctly.
For now the script just checks if the turtle body has the string `"true"` in there somewhere.

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

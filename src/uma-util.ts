import { joinUrl } from './constants';

// Performs the necessary steps to acquire a resource from an UMA-protected RS.
// Returns undefined if access was not granted.
// Does not handle errors.
export async function performUmaRequest(target: string, webId: string, init?: RequestInit): Promise<{ response: Response, token?: string } | undefined> {
  const noTokenResponse = await fetch(target, init);
  if (noTokenResponse.status === 200) {
    return { response: noTokenResponse };
  }
  const wwwAuthenticateHeader = noTokenResponse.headers.get("WWW-Authenticate")!
  const { as_uri, ticket } = Object.fromEntries(wwwAuthenticateHeader.replace(/^UMA /,'').split(', ').map(
    param => param.split('=').map(s => s.replace(/"/g,''))
  ));

  const configUrl = joinUrl(as_uri, '.well-known/uma2-configuration');
  const configData = await (await fetch(configUrl)).json();
  const tokenEndpoint = configData.token_endpoint;

  const content = {
    grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
    ticket,
    claim_token_format: 'urn:solidlab:uma:claims:formats:meta',
    claim_token: JSON.stringify({
      'urn:solidlab:uma:claims:formats:webid': encodeURIComponent(webId),
      'http://www.w3.org/ns/odrl/2/purpose': 'urn:shopping:preferences',
    }),
  };

  const asRequestResponse = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type":"application/json"
    },
    body: JSON.stringify(content),
  });
  if (asRequestResponse.status >= 400) {
    return;
  }

  const asResponse: any = await asRequestResponse.json();

  const headers = { 'Authorization': `${asResponse.token_type} ${asResponse.access_token}` };

  return {
    response: await fetch(target, { ...init, headers: { ...init?.headers, ...headers } }),
    token: asResponse.access_token,
  };
}

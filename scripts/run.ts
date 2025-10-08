import {
  carbsPreferenceResource,
  cookies,
  delfourId,
  lowSugarCookies,
  rubenId,
  sugarPreferenceResource
} from '../src/constants';
import { ShoppingCart } from '../src/shopping-cart';
import { performUmaRequest } from '../src/uma-util';
import { setup } from './setup';

async function logToken(token?: string) {
  if (!token) {
    return;
  }
  const permissions = (await import('jose')).decodeJwt(token).permissions;
  console.log('Access token', JSON.stringify(permissions, null, 2));
  for (const permission of permissions as { policies: string[] }[]) {
    for (const policy of permission.policies) {
      const response = await fetch(policy);
      console.log('Policy', policy, ':');
      console.log(await response.text())
    }
  }
}

const preferences: Record<string, { sugar: boolean, carbs: boolean }> = {};

(async () => {
  await setup();

  console.log('Activating scanner as', rubenId);

  // User activates scanner.
  // Let's assume this is done by scanning a QR code in the store near the scanner devices,
  // and this QR code is decoded into the user's WebID.

  // Send request to user RS for each preference
  console.log('Determining user preferences');
  const sugarResponse = await performUmaRequest(sugarPreferenceResource, delfourId);
  const carbsResponse = await performUmaRequest(carbsPreferenceResource, delfourId);
  const sugarText = await sugarResponse?.response.text();
  const carbsText = await carbsResponse?.response.text();
  console.log('\nSugar preference response');
  console.log(sugarText);
  await logToken(sugarResponse?.token);
  console.log('\nCarbs preference response');
  console.log(carbsText);
  await logToken(carbsResponse?.token);
  const sugarPreferences = sugarText?.includes('true');
  const carbsPreferences = carbsText?.includes('true');
  preferences[rubenId] = { sugar: Boolean(sugarPreferences), carbs: Boolean(carbsPreferences) };

  console.log('\nScanner can show low sugar alternatives:', sugarPreferences, '(undefined implies no permission to see)');
  console.log('Scanner can show low carbs alternatives:', carbsPreferences, '(undefined implies no permission to see)');
  console.log('Storing preferences in local storage', preferences);

  const cart = new ShoppingCart(rubenId, preferences[rubenId]);

  // Now to simulate the user scanning a resource
  console.log('\nScanning', cookies);
  const parsedCookies = await cart.scan(cookies);
  console.log(parsedCookies);

  // User decides to remove the cookies and scan a low-sugar alternative
  console.log('\nRemoving cookies and scanning low-sugar alternative', lowSugarCookies);
  cart.remove(cookies);
  const parsedLowSugarCookies = await cart.scan(lowSugarCookies);
  console.log(parsedLowSugarCookies);

  console.log('\n\nFinished shopping, generating shopping ticket:\n');
  const ticket = cart.generateTicket();
  console.log(ticket);
  delete preferences[rubenId];
  console.log('\n\nRemoving preferences from local storage', preferences);
})();

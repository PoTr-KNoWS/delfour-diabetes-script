import {
  carbsPreferenceResource,
  cookies,
  delfourId,
  lowSugarCookies,
  rubenId,
  sugarPreferenceResource
} from './constants';
import { setup } from './setup';
import { ShoppingCart } from './shopping-cart';
import { performUmaRequest } from './uma-util';

(async () => {
  // TODO: put this in separate script so the test script can be run multiple times without rewriting the data
  await setup();

  console.log('Activating scanner as', rubenId);

  // User activates scanner.
  // Let's assume this is done by scanning a QR code in the store near the scanner devices,
  // and this QR code is decoded into the user's WebID.

  // Send request to user RS for each preference
  console.log('Determining user preferences');
  const sugarResponse = await performUmaRequest(sugarPreferenceResource, delfourId);
  const carbsResponse = await performUmaRequest(carbsPreferenceResource, delfourId);
  const sugarText = await sugarResponse?.text();
  const carbsText = await carbsResponse?.text();
  console.log('\nSugar preference response', sugarText);
  console.log('\nCarbs response', carbsText);
  const sugarPreferences = sugarText?.includes('"true"');
  const carbsPreferences = carbsText?.includes('"true"');

  console.log('\nScanner can show low sugar alternatives:', sugarPreferences, '(undefined implies no permission to see)');
  console.log('Scanner can show low carbs alternatives:', carbsPreferences, '(undefined implies no permission to see)');

  const cart = new ShoppingCart(rubenId, {
    sugar: Boolean(sugarPreferences),
    carbs: Boolean(carbsPreferences),
  });

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
})();

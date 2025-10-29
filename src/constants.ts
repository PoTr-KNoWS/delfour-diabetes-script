
export const uma = process.env.DEMO_UMA ?? 'http://localhost:4000/uma';
export const rsRuben = process.env.DEMO_RUBEN ?? 'http://localhost:3000';
export const rsDelfour = process.env.DEMO_DELFOUR ?? 'http://localhost:3001';

// The demo setup is currently hardcoded to work with this specific container (due to cold start issues)
export const policyContainer = joinUrl(rsRuben, '/settings/policies/');

export const rubenId = joinUrl(rsRuben, '/123-456-789/profile/card#me');
export const delfourId = joinUrl(rsDelfour, '/delfour/profile/card#me');

export const sugarPreferenceResource = joinUrl(rsRuben, '/ruben/preferences/sugar');
export const carbsPreferenceResource = joinUrl(rsRuben, '/ruben/preferences/carbs');

export const cookies = joinUrl(rsDelfour, '/delfour/products/BIS_001');
export const lowSugarCookies = joinUrl(rsDelfour, '/delfour/products/BIS_101');
export const chocolate = joinUrl(rsDelfour, '/delfour/products/CHOC_050');
export const lowSugarChocolate = joinUrl(rsDelfour, '/delfour/products/CHOC_150');

export function joinUrl(root: string, part: string): string {
  return new URL(part, root.replace(/\/*$/u, '/')).href;
}

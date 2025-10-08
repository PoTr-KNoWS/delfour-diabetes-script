import {
  carbsPreferenceResource,
  chocolate,
  cookies,
  delfourId,
  lowSugarChocolate,
  lowSugarCookies,
  rubenId,
  sugarPreferenceResource
} from './constants';
import { ParsedItem, parseItem, ShoppingCart } from './shopping-cart';
import { performUmaRequest } from './uma-util';

async function extractBool(res?: Response): Promise<boolean> {
  if (!res) return false;
  return (await res.text()).includes('true');
}

async function readPreferences() {
  const sugarRaw = await performUmaRequest(sugarPreferenceResource, delfourId);
  const carbsRaw = await performUmaRequest(carbsPreferenceResource, delfourId);
  const sugar = await extractBool(sugarRaw?.response);
  const carbs = await extractBool(carbsRaw?.response);
  return { sugar, carbs };
}

async function main() {
  const productUrls = [cookies, lowSugarCookies, chocolate, lowSugarChocolate];

  // DOM elements
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const userIdInput = document.getElementById('userId') as HTMLInputElement;
  const productSelect = document.getElementById('product') as HTMLSelectElement;
  const scanBtn = document.getElementById('scanBtn') as HTMLButtonElement;
  const alternativesEl = document.getElementById('alternatives') as HTMLUListElement;
  const cartEl = document.getElementById('cart') as HTMLUListElement;
  const finishBtn = document.getElementById('finishBtn') as HTMLButtonElement;
  const outputPre = document.getElementById('output') as HTMLPreElement;
  const prefsEl = document.getElementById('prefs') as HTMLPreElement;

  // Default WebID to the only one that works with the demo setup
  userIdInput.value = rubenId;

  // === (a) Load and parse all products on page load ===
  const productMap = new Map<string, ParsedItem>();
  outputPre.textContent = 'Loading products...';
  for (const url of productUrls) {
    try {
      const itemResponse = await fetch(url);
      const parsed = parseItem(await itemResponse.text(), url);
      productMap.set(url, parsed);
    } catch (err) {
      console.error('Failed to parse product', url, err);
    }
  }
  outputPre.textContent = 'Products loaded. Click "Start" to begin.';

  // Populate dropdown with product names
  productSelect.innerHTML = '';
  for (const [url, parsed] of productMap.entries()) {
    const opt = document.createElement('option');
    opt.value = url;
    opt.textContent = parsed.name || url;
    productSelect.appendChild(opt);
  }

  // Disable main controls until start
  [productSelect, scanBtn, finishBtn].forEach(el => (el.disabled = true));

  // Preferences store + UI renderer
  const prefsStore: Record<string, { sugar: boolean; carbs: boolean }> = {};
  function renderPrefs() {
    prefsEl.textContent = JSON.stringify(prefsStore, null, 2);
  }

  // Cart + local state
  let cart: ShoppingCart | null = null;
  const scannedRecords: Array<{ product: string; parsed: ParsedItem }> = [];

  function renderCart() {
    cartEl.innerHTML = '';
    scannedRecords.forEach((rec, idx) => {
      const li = document.createElement('li');
      li.textContent = rec.parsed.name;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        cart?.remove(rec.product);
        scannedRecords.splice(idx, 1);
        renderCart();
      });
      li.appendChild(removeBtn);
      cartEl.appendChild(li);
    });
  }

  // === (c) Start button behavior ===
  startBtn.addEventListener('click', async () => {
    const userId = userIdInput.value.trim();
    outputPre.textContent = `Loading preferences for ${userId}...`;

    const prefs = await readPreferences();
    prefsStore[userId] = { sugar: Boolean(prefs.sugar), carbs: Boolean(prefs.carbs) };
    renderPrefs();

    cart = new ShoppingCart(userId, prefsStore[userId]);
    [productSelect, scanBtn, finishBtn].forEach(el => (el.disabled = false));

    outputPre.textContent = `Shopping session started for ${userId}.`;
  });

  // === Scan button ===
  scanBtn.addEventListener('click', async () => {
    if (!cart) {
      outputPre.textContent = 'Click "Start" first!';
      return;
    }
    alternativesEl.innerHTML = '';
    const product = productSelect.value;
    const parsed = await cart.scan(product);
    scannedRecords.push({ product, parsed });
    renderCart();

    if (parsed.lessSugar.length || parsed.lessCarbs.length) {
      console.log(productMap);
      parsed.lessSugar.forEach(a => {
        console.log(a);
        const li = document.createElement('li');
        li.textContent = 'Less sugar: ' + (productMap.get(a)?.name || a);
        alternativesEl.appendChild(li);
      });
      parsed.lessCarbs.forEach(a => {
        const li = document.createElement('li');
        li.textContent = 'Less carbs: ' + (productMap.get(a)?.name || a);
        alternativesEl.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No alternatives suggested';
      alternativesEl.appendChild(li);
    }

    outputPre.textContent = 'Parsed scan result:\n' + JSON.stringify(parsed, null, 2);
  });

  // === Finish button ===
  finishBtn.addEventListener('click', async () => {
    if (!cart) return;
    outputPre.textContent = cart.generateTicket();

    scannedRecords.length = 0;
    renderCart();
    delete prefsStore[rubenId];
    renderPrefs();

    [productSelect, scanBtn, finishBtn].forEach(el => (el.disabled = true));
  });

  // Render initial prefs (empty)
  renderPrefs();
}

main().catch(err => {
  console.error(err);
  const el = document.getElementById('output') as HTMLPreElement | null;
  if (el) el.textContent = String(err);
});

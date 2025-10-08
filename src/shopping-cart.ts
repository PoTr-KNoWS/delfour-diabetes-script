import { Parser, Store } from 'n3';
import { DELFOUR, SCHEMA } from './vocabulary';

export type ParsedItem = { name: string, price: number, lessSugar: string[], lessCarbs: string[] };

// Parses Delfour item descriptions
export function parseItem(turtle: string, itemId: string): ParsedItem {
  const data = new Store(new Parser({ baseIRI: itemId }).parse(turtle));
  return {
    name: data.getQuads(null, SCHEMA.terms.name, null, null)[0].object.value,
    price: Number(data.getQuads(null, SCHEMA.terms.price, null, null)[0].object.value),
    lessSugar: data.getQuads(null, DELFOUR.terms.lessSugar, null, null).map(({ object }) => object.value),
    lessCarbs: data.getQuads(null, DELFOUR.terms.lessCarbs, null, null).map(({ object }) => object.value),
  }
}

export class ShoppingCart {
  public readonly scanned: Record<string, number> = {};
  public readonly parsed: Record<string, ParsedItem> = {};

  public constructor(
    public readonly userId: string,
    public readonly preferences: { sugar: boolean, carbs: boolean },
  ){}

  public async scan(itemId: string): Promise<ParsedItem> {
    const itemResponse = await fetch(itemId);
    const parsed = parseItem(await itemResponse.text(), itemId);
    if (!this.preferences.sugar) {
      parsed.lessSugar = [];
    }
    if (!this.preferences.carbs) {
      parsed.lessCarbs = [];
    }

    this.scanned[itemId] = this.scanned[itemId] ? this.scanned[itemId] + 1 : 1;
    this.parsed[itemId] = parsed;

    return parsed;
  }

  public remove(itemId: string) {
    if (this.scanned[itemId]) {
      this.scanned[itemId]--;
      if (this.scanned[itemId] <= 0) {
        delete this.scanned[itemId];
      }
    }
  }

  public generateTicket(): string {
    let result = `Ticket #123
For ${this.userId}
At ${new Date()}
`;

    let sum = 0;
    for (const [ id, count ] of Object.entries(this.scanned)) {
      const parsed = this.parsed[id];
      result += `${count}x ${parsed.name}: ${count * parsed.price}\n`;
      sum += count * parsed.price;
    }

    result += `Total: ${sum}\n`;
    result += 'Thank you for shopping at Delfour!';

    return result;
  }
}

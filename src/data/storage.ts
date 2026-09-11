import { Receipt, ReceiptItem, ProductPrice, ReceiptTemplate, PriceComparisonItem, ReceiptSummaryItem } from '../types';

const STORAGE_KEYS = {
  RECEIPTS: 'receipt_entry_receipts_v1',
  RECEIPT_ITEMS: 'receipt_entry_items_v1',
  PRODUCT_PRICES: 'receipt_entry_prices_v1',
  TEMPLATES: 'receipt_entry_templates_v1',
};

export const DEFAULT_TEMPLATES: ReceiptTemplate[] = [
  {
    id: 1,
    name: '生鲜超市两行式（品名+条码数量单价金额）',
    storeName: '',
    namePattern: '^([^\\d\\s\\=\\-].*)$',
    nameGroup: '1',
    barcodePattern: '^(\\d{8,18})',
    barcodeGroup: '1',
    pricePattern: '^(\\d{8,18})\\s+([\\d\\.]+)\\s+([\\d\\.]+)\\s+([\\d\\.]+)$',
    qtyGroup: '2',
    unitPriceGroup: '3',
    totalPriceGroup: '4',
    skipPattern: '^[\\=\\-\\s]+$|货号[\\/、]品名|数量\\s+单价|交易时间|销售|合计|总计|找零|现金|件数|购物篮',
    lineOrder: 'name,price',
    isDefault: true,
    createdAt: new Date('2026-03-09T08:00:00Z').toISOString(),
  },
  {
    id: 2,
    name: '得瑞市模板',
    storeName: '得瑞市',
    namePattern: '^(.+?)(\\d{11,14})\\s*$',
    nameGroup: '1',
    barcodeGroup: '2',
    pricePattern: '^(\\d+)\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s*$',
    qtyGroup: '1',
    unitPriceGroup: '2',
    totalPriceGroup: '3',
    skipPattern: '品名|数量|单价|金额|合计|总计|单号|店号|工号|谢谢|欢迎',
    lineOrder: 'name,price',
    isDefault: false,
    createdAt: new Date('2026-01-01T08:00:00Z').toISOString(),
  },
  {
    id: 3,
    name: '超市散称（含条码）',
    storeName: '',
    namePattern: '^(.+?/kg)\\s*$',
    nameGroup: '1',
    barcodePattern: '^(\\d{11,14})$',
    barcodeGroup: '1',
    pricePattern: '^(\\d+)\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)$',
    qtyGroup: '1',
    unitPriceGroup: '2',
    totalPriceGroup: '3',
    skipPattern: '品名|数量|单价|金额|合计|总计',
    lineOrder: 'name,barcode,price',
    isDefault: false,
    createdAt: new Date('2026-01-01T08:05:00Z').toISOString(),
  },
  {
    id: 4,
    name: '超市包装商品',
    storeName: '',
    namePattern: '^(.+?)\\s*$',
    nameGroup: '1',
    barcodePattern: '^(\\d{11,14})$',
    barcodeGroup: '1',
    pricePattern: '^(\\d+)\\.?\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)$',
    qtyGroup: '1',
    unitPriceGroup: '2',
    totalPriceGroup: '3',
    skipPattern: '品名|数量|单价|金额|合计|总计',
    lineOrder: 'name,barcode,price',
    isDefault: false,
    createdAt: new Date('2026-01-01T08:10:00Z').toISOString(),
  },
  {
    id: 5,
    name: '单行格式（传统小票）',
    storeName: '',
    namePattern: '^(.+?)\\s+(\\d+)\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)\\s*$',
    nameGroup: '1',
    qtyGroup: '2',
    unitPriceGroup: '3',
    totalPriceGroup: '4',
    skipPattern: '品名|数量|单价|金额|合计|总计',
    lineOrder: 'name',
    isDefault: false,
    createdAt: new Date('2026-01-01T08:15:00Z').toISOString(),
  },
];

const SEED_RECEIPTS: Receipt[] = [
  {
    id: 1,
    storeName: '得瑞市厦门大悦城店',
    date: '2026-03-08',
    note: '周末日用品采购',
    receiptNumber: '2026030800192',
    totalAmount: 46.70,
    theoreticalAmount: 46.70,
    createdAt: new Date('2026-03-08T14:30:00Z').toISOString(),
  },
  {
    id: 2,
    storeName: '永辉超市万象城店',
    date: '2026-03-05',
    note: '生鲜水果与零食',
    receiptNumber: '2026030588201',
    totalAmount: 78.50,
    theoreticalAmount: 78.50,
    createdAt: new Date('2026-03-05T19:15:00Z').toISOString(),
  },
];

const SEED_ITEMS: ReceiptItem[] = [
  {
    id: 1,
    receiptId: 1,
    productName: '三元白雪原味酸奶100g/杯',
    barcode: '2123321003487',
    quantity: 2,
    unitPrice: 10.90,
    totalPrice: 21.80,
  },
  {
    id: 2,
    receiptId: 1,
    productName: '每日鲜语全脂鲜牛奶450ml',
    barcode: '6901234567890',
    quantity: 1,
    unitPrice: 14.90,
    totalPrice: 14.90,
  },
  {
    id: 3,
    receiptId: 1,
    productName: '全麦吐司面包250g',
    barcode: '6923456789012',
    quantity: 1,
    unitPrice: 10.00,
    totalPrice: 10.00,
  },
  {
    id: 4,
    receiptId: 2,
    productName: '三元白雪原味酸奶100g/杯',
    barcode: '2123321003487',
    quantity: 1,
    unitPrice: 11.50,
    totalPrice: 11.50,
  },
  {
    id: 5,
    receiptId: 2,
    productName: '红富士苹果/kg',
    barcode: '2100054321098',
    quantity: 2,
    unitPrice: 15.00,
    totalPrice: 30.00,
  },
  {
    id: 6,
    receiptId: 2,
    productName: '可口可乐330ml*6听',
    barcode: '6900012345671',
    quantity: 1,
    unitPrice: 18.00,
    totalPrice: 18.00,
  },
  {
    id: 7,
    receiptId: 2,
    productName: '每日鲜语全脂鲜牛奶450ml',
    barcode: '6901234567890',
    quantity: 1,
    unitPrice: 16.00,
    totalPrice: 16.00,
  },
  {
    id: 8,
    receiptId: 2,
    productName: '天然苏打水500ml',
    barcode: '6933344556677',
    quantity: 1,
    unitPrice: 3.00,
    totalPrice: 3.00,
  },
];

const SEED_PRICES: ProductPrice[] = [
  {
    id: 1,
    productName: '三元白雪原味酸奶100g/杯',
    price: 10.90,
    storeName: '得瑞市厦门大悦城店',
    lastUpdated: '2026-03-08',
  },
  {
    id: 2,
    productName: '每日鲜语全脂鲜牛奶450ml',
    price: 14.90,
    storeName: '得瑞市厦门大悦城店',
    lastUpdated: '2026-03-08',
  },
  {
    id: 3,
    productName: '全麦吐司面包250g',
    price: 10.00,
    storeName: '得瑞市厦门大悦城店',
    lastUpdated: '2026-03-08',
  },
  {
    id: 4,
    productName: '三元白雪原味酸奶100g/杯',
    price: 11.50,
    storeName: '永辉超市万象城店',
    lastUpdated: '2026-03-05',
  },
  {
    id: 5,
    productName: '红富士苹果/kg',
    price: 15.00,
    storeName: '永辉超市万象城店',
    lastUpdated: '2026-03-05',
  },
  {
    id: 6,
    productName: '可口可乐330ml*6听',
    price: 18.00,
    storeName: '永辉超市万象城店',
    lastUpdated: '2026-03-05',
  },
  {
    id: 7,
    productName: '每日鲜语全脂鲜牛奶450ml',
    price: 16.00,
    storeName: '永辉超市万象城店',
    lastUpdated: '2026-03-05',
  },
  {
    id: 8,
    productName: '天然苏打水500ml',
    price: 3.00,
    storeName: '永辉超市万象城店',
    lastUpdated: '2026-03-05',
  },
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(key);
      if (!val) return defaultValue;
      return JSON.parse(val) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  constructor() {
    this.init();
  }

  private init() {
    let existingTemplates = this.get<ReceiptTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    if (!existingTemplates || existingTemplates.length === 0) {
      this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    } else {
      const hasTwoLine = existingTemplates.some(t => t && t.name && t.name.includes('生鲜超市两行式'));
      if (!hasTwoLine) {
        existingTemplates = [
          DEFAULT_TEMPLATES[0],
          ...existingTemplates.map(t => ({ ...t, isDefault: false })),
        ];
      }

      // Deduplicate by name and ensure strictly unique sequential positive IDs
      const seenNames = new Set<string>();
      const sanitized: ReceiptTemplate[] = [];
      let nextId = 1;

      for (const t of existingTemplates) {
        if (!t || !t.name) continue;
        const trimmedName = t.name.trim();
        if (seenNames.has(trimmedName)) continue;
        seenNames.add(trimmedName);

        sanitized.push({
          ...t,
          id: nextId++,
        });
      }

      // Ensure at least one template is marked as default
      if (!sanitized.some(t => t.isDefault) && sanitized.length > 0) {
        sanitized[0].isDefault = true;
      }

      this.set(STORAGE_KEYS.TEMPLATES, sanitized);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
      this.set(STORAGE_KEYS.RECEIPTS, SEED_RECEIPTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECEIPT_ITEMS)) {
      this.set(STORAGE_KEYS.RECEIPT_ITEMS, SEED_ITEMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCT_PRICES)) {
      this.set(STORAGE_KEYS.PRODUCT_PRICES, SEED_PRICES);
    }
  }

  getAllReceipts(): Receipt[] {
    const receipts = this.get<Receipt[]>(STORAGE_KEYS.RECEIPTS, []);
    return receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getItemsByReceiptId(receiptId: number): ReceiptItem[] {
    const items = this.get<ReceiptItem[]>(STORAGE_KEYS.RECEIPT_ITEMS, []);
    return items.filter(it => it.receiptId === receiptId);
  }

  insertReceiptWithItems(receipt: Omit<Receipt, 'id'>, items: Omit<ReceiptItem, 'id' | 'receiptId'>[]): number {
    const receipts = this.getAllReceipts();
    const newReceiptId = receipts.length > 0 ? Math.max(...receipts.map(r => r.id)) + 1 : 1;

    const fullReceipt: Receipt = {
      ...receipt,
      id: newReceiptId,
      createdAt: receipt.createdAt || new Date().toISOString(),
    };
    receipts.unshift(fullReceipt);
    this.set(STORAGE_KEYS.RECEIPTS, receipts);

    const allItems = this.get<ReceiptItem[]>(STORAGE_KEYS.RECEIPT_ITEMS, []);
    let nextItemId = allItems.length > 0 ? Math.max(...allItems.map(it => it.id || 0)) + 1 : 1;

    const newItems: ReceiptItem[] = items.map(it => ({
      ...it,
      id: nextItemId++,
      receiptId: newReceiptId,
    }));
    this.set(STORAGE_KEYS.RECEIPT_ITEMS, [...allItems, ...newItems]);

    // Update prices
    const prices = this.getAllProductPrices();
    let nextPriceId = prices.length > 0 ? Math.max(...prices.map(p => p.id || 0)) + 1 : 1;

    const updatedPrices = [...prices];
    for (const it of items) {
      if (it.unitPrice > 0 && it.productName.trim()) {
        updatedPrices.unshift({
          id: nextPriceId++,
          productName: it.productName.trim(),
          price: it.unitPrice,
          storeName: receipt.storeName || undefined,
          lastUpdated: receipt.date || new Date().toISOString().substring(0, 10),
        });
      }
    }
    this.set(STORAGE_KEYS.PRODUCT_PRICES, updatedPrices);

    return newReceiptId;
  }

  deleteReceipt(id: number): void {
    const receipts = this.getAllReceipts().filter(r => r.id !== id);
    this.set(STORAGE_KEYS.RECEIPTS, receipts);

    const items = this.get<ReceiptItem[]>(STORAGE_KEYS.RECEIPT_ITEMS, []).filter(it => it.receiptId !== id);
    this.set(STORAGE_KEYS.RECEIPT_ITEMS, items);
  }

  deleteReceiptByNumber(receiptNumber: string): void {
    const receipts = this.getAllReceipts();
    const targets = receipts.filter(r => r.receiptNumber === receiptNumber);
    const targetIds = new Set(targets.map(r => r.id));

    const remainingReceipts = receipts.filter(r => !targetIds.has(r.id));
    this.set(STORAGE_KEYS.RECEIPTS, remainingReceipts);

    const remainingItems = this.get<ReceiptItem[]>(STORAGE_KEYS.RECEIPT_ITEMS, []).filter(it => !targetIds.has(it.receiptId));
    this.set(STORAGE_KEYS.RECEIPT_ITEMS, remainingItems);
  }

  getReceiptSummary(): ReceiptSummaryItem[] {
    const receipts = this.getAllReceipts();
    const allItems = this.get<ReceiptItem[]>(STORAGE_KEYS.RECEIPT_ITEMS, []);

    return receipts.map(r => {
      const items = allItems.filter(it => it.receiptId === r.id);
      const itemCount = items.length;
      const actualTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
      const theoreticalTotal = items.reduce((sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0), 0);

      return {
        ...r,
        itemCount,
        actualTotal: actualTotal > 0 ? actualTotal : r.totalAmount,
        theoreticalTotal: theoreticalTotal > 0 ? theoreticalTotal : r.theoreticalAmount,
        items,
      };
    });
  }

  getAllProductPrices(): ProductPrice[] {
    const prices = this.get<ProductPrice[]>(STORAGE_KEYS.PRODUCT_PRICES, []);
    return prices.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  getPriceComparisonData(): PriceComparisonItem[] {
    const prices = this.getAllProductPrices();
    const grouped = new Map<string, number[]>();

    for (const p of prices) {
      if (!p.productName) continue;
      const list = grouped.get(p.productName) || [];
      list.push(p.price);
      grouped.set(p.productName, list);
    }

    const result: PriceComparisonItem[] = [];
    grouped.forEach((priceList, productName) => {
      const minPrice = Math.min(...priceList);
      const maxPrice = Math.max(...priceList);
      const sum = priceList.reduce((acc, curr) => acc + curr, 0);
      const avgPrice = sum / priceList.length;

      result.push({
        productName,
        minPrice,
        maxPrice,
        avgPrice: parseFloat(avgPrice.toFixed(2)),
        recordCount: priceList.length,
      });
    });

    return result.sort((a, b) => a.productName.localeCompare(b.productName, 'zh-CN'));
  }

  getAllTemplates(): ReceiptTemplate[] {
    const rawTemplates = this.get<ReceiptTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const seenIds = new Set<number>();
    const seenNames = new Set<string>();
    const templates: ReceiptTemplate[] = [];
    let maxId = 0;

    for (const t of rawTemplates) {
      if (t && t.id) maxId = Math.max(maxId, t.id);
    }
    let fallbackId = maxId + 1;

    for (const t of rawTemplates) {
      if (!t || !t.name) continue;
      const trimmedName = t.name.trim();
      if (seenNames.has(trimmedName)) continue;
      seenNames.add(trimmedName);

      let cleanId = t.id;
      if (!cleanId || seenIds.has(cleanId)) {
        cleanId = fallbackId++;
      }
      seenIds.add(cleanId);

      templates.push({
        ...t,
        id: cleanId,
      });
    }

    return templates.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  }

  getDefaultTemplate(): ReceiptTemplate | null {
    return this.getAllTemplates().find(t => t.isDefault) || this.getAllTemplates()[0] || null;
  }

  insertTemplate(template: Omit<ReceiptTemplate, 'id'>): number {
    const templates = this.getAllTemplates();
    const newId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;
    let list = [...templates];

    if (template.isDefault) {
      list = list.map(t => ({ ...t, isDefault: false }));
    }

    const newTemplate: ReceiptTemplate = {
      ...template,
      id: newId,
      createdAt: template.createdAt || new Date().toISOString(),
    };

    list.push(newTemplate);
    this.set(STORAGE_KEYS.TEMPLATES, list);
    return newId;
  }

  updateTemplate(template: ReceiptTemplate): void {
    let list = this.getAllTemplates();
    if (template.isDefault) {
      list = list.map(t => ({ ...t, isDefault: t.id === template.id }));
    }
    const idx = list.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      list[idx] = template;
      this.set(STORAGE_KEYS.TEMPLATES, list);
    }
  }

  deleteTemplate(id: number): void {
    const list = this.getAllTemplates().filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TEMPLATES, list);
  }

  setDefaultTemplate(id: number): void {
    const list = this.getAllTemplates().map(t => ({
      ...t,
      isDefault: t.id === id,
    }));
    this.set(STORAGE_KEYS.TEMPLATES, list);
  }

  resetToDefaults(): void {
    this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    this.set(STORAGE_KEYS.RECEIPTS, SEED_RECEIPTS);
    this.set(STORAGE_KEYS.RECEIPT_ITEMS, SEED_ITEMS);
    this.set(STORAGE_KEYS.PRODUCT_PRICES, SEED_PRICES);
  }
}

export const storage = new StorageService();

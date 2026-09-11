export interface ReceiptItem {
  id?: number;
  receiptId: number;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  id: number;
  storeName: string;
  date: string;
  note?: string;
  receiptNumber?: string;
  photoPath?: string;
  totalAmount: number;
  theoreticalAmount: number;
  createdAt: string;
  items?: ReceiptItem[];
}

export interface ProductPrice {
  id?: number;
  productName: string;
  price: number;
  storeName?: string;
  lastUpdated: string;
}

export interface ReceiptTemplate {
  id: number;
  name: string;
  storeName: string;
  namePattern?: string;
  barcodePattern?: string;
  pricePattern?: string;
  skipPattern?: string;
  nameGroup?: string;
  barcodeGroup?: string;
  qtyGroup?: string;
  unitPriceGroup?: string;
  totalPriceGroup?: string;
  lineOrder?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PriceComparisonItem {
  productName: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recordCount: number;
}

export interface ReceiptSummaryItem extends Receipt {
  itemCount: number;
  actualTotal: number;
  theoreticalTotal: number;
}

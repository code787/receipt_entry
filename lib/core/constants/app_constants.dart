class AppConstants {
  static const String appName = '小票录入系统';
  static const String databaseName = 'receipt_entry.db';
  static const int databaseVersion = 6;

  static const String tableReceipts = 'receipts';
  static const String tableReceiptItems = 'receipt_items';
  static const String tableProductPrices = 'product_prices';
  static const String tableReceiptTemplates = 'receipt_templates';

  static const String colId = 'id';
  static const String colReceiptId = 'receipt_id';
  static const String colProductName = 'product_name';
  static const String colBarcode = 'barcode';
  static const String colQuantity = 'quantity';
  static const String colUnitPrice = 'unit_price';
  static const String colTotalPrice = 'total_price';
  static const String colStoreName = 'store_name';
  static const String colDate = 'date';
  static const String colNote = 'note';
  static const String colCreatedAt = 'created_at';
  static const String colPrice = 'price';
  static const String colLastUpdated = 'last_updated';
  static const String colReceiptNumber = 'receipt_number';
  static const String colReceiptPhoto = 'receipt_photo';
}

import '../local/database_helper.dart';
import '../models/receipt.dart';
import '../models/receipt_item.dart';
import '../models/product_price.dart';
import '../../core/constants/app_constants.dart';

class ReceiptRepository {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  Future<int> insertReceiptWithItems(Receipt receipt, List<ReceiptItem> items) async {
    final db = await _dbHelper.database;
    return await db.transaction((tx) async {
      final receiptId = await tx.insert(AppConstants.tableReceipts, receipt.toMap());
      for (final item in items) {
        await tx.insert(AppConstants.tableReceiptItems, {...item.toMap(), AppConstants.colReceiptId: receiptId});
      }
      return receiptId;
    });
  }

  Future<List<Receipt>> getAllReceipts() async {
    final db = await _dbHelper.database;
    final maps = await db.query(AppConstants.tableReceipts, orderBy: '${AppConstants.colCreatedAt} DESC');
    return maps.map((m) => Receipt.fromMap(m)).toList();
  }

  Future<Receipt?> getReceiptById(int id) async {
    final db = await _dbHelper.database;
    final maps = await db.query(AppConstants.tableReceipts, where: '${AppConstants.colId} = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return Receipt.fromMap(maps.first);
  }

  Future<List<ReceiptItem>> getItemsByReceiptId(int receiptId) async {
    final db = await _dbHelper.database;
    final maps = await db.query(AppConstants.tableReceiptItems, where: '${AppConstants.colReceiptId} = ?', whereArgs: [receiptId]);
    return maps.map((m) => ReceiptItem.fromMap(m)).toList();
  }

  Future<void> deleteReceipt(int id) async {
    final db = await _dbHelper.database;
    await db.delete(AppConstants.tableReceipts, where: '${AppConstants.colId} = ?', whereArgs: [id]);
  }

  Future<void> insertProductPrice(ProductPrice price) async {
    final db = await _dbHelper.database;
    await db.insert(AppConstants.tableProductPrices, price.toMap());
  }

  Future<List<ProductPrice>> getAllProductPrices() async {
    final db = await _dbHelper.database;
    final maps = await db.query(AppConstants.tableProductPrices, orderBy: '${AppConstants.colLastUpdated} DESC');
    return maps.map((m) => ProductPrice.fromMap(m)).toList();
  }

  Future<double?> getLatestPrice(String productName) async {
    final db = await _dbHelper.database;
    final maps = await db.query(
      AppConstants.tableProductPrices,
      where: '${AppConstants.colProductName} = ?',
      whereArgs: [productName],
      orderBy: '${AppConstants.colLastUpdated} DESC',
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return (maps.first[AppConstants.colPrice] as num).toDouble();
  }

  Future<List<Map<String, dynamic>>> getProductPriceHistory(String productName) async {
    final db = await _dbHelper.database;
    return await db.query(
      AppConstants.tableProductPrices,
      where: '${AppConstants.colProductName} = ?',
      whereArgs: [productName],
      orderBy: '${AppConstants.colLastUpdated} DESC',
    );
  }

  Future<List<Map<String, dynamic>>> getPriceComparisonData() async {
    final db = await _dbHelper.database;
    return await db.rawQuery('''
      SELECT ${AppConstants.colProductName}, 
        MIN(${AppConstants.colPrice}) as min_price,
        MAX(${AppConstants.colPrice}) as max_price,
        AVG(${AppConstants.colPrice}) as avg_price,
        COUNT(*) as record_count
      FROM ${AppConstants.tableProductPrices}
      GROUP BY ${AppConstants.colProductName}
      ORDER BY ${AppConstants.colProductName}
    ''');
  }

  Future<List<Map<String, dynamic>>> getReceiptSummary() async {
    final db = await _dbHelper.database;
    return await db.rawQuery('''
      SELECT r.*, 
        (SELECT COUNT(*) FROM ${AppConstants.tableReceiptItems} WHERE ${AppConstants.colReceiptId} = r.${AppConstants.colId}) as item_count,
        (SELECT SUM(${AppConstants.colTotalPrice}) FROM ${AppConstants.tableReceiptItems} WHERE ${AppConstants.colReceiptId} = r.${AppConstants.colId}) as actual_total,
        (SELECT SUM(${AppConstants.colUnitPrice} * ${AppConstants.colQuantity}) FROM ${AppConstants.tableReceiptItems} WHERE ${AppConstants.colReceiptId} = r.${AppConstants.colId}) as theoretical_amount
      FROM ${AppConstants.tableReceipts} r
      ORDER BY r.${AppConstants.colCreatedAt} DESC
    ''');
  }
}

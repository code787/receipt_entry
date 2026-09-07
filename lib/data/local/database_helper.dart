import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:async';
import '../../core/constants/app_constants.dart';
import '../models/receipt_template.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._();
  static Database? _database;

  DatabaseHelper._();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, AppConstants.databaseName);
    return await openDatabase(
      path,
      version: AppConstants.databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE ${AppConstants.tableReceipts} (
        ${AppConstants.colId} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${AppConstants.colStoreName} TEXT NOT NULL,
        ${AppConstants.colDate} TEXT NOT NULL,
        ${AppConstants.colNote} TEXT,
        ${AppConstants.colReceiptNumber} TEXT,
        ${AppConstants.colReceiptPhoto} TEXT,
        ${AppConstants.colTotalPrice} REAL NOT NULL DEFAULT 0,
        ${AppConstants.colTotalPrice}_theoretical REAL NOT NULL DEFAULT 0,
        ${AppConstants.colCreatedAt} TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE ${AppConstants.tableReceiptItems} (
        ${AppConstants.colId} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${AppConstants.colReceiptId} INTEGER NOT NULL,
        ${AppConstants.colProductName} TEXT NOT NULL,
        ${AppConstants.colBarcode} TEXT,
        ${AppConstants.colQuantity} INTEGER NOT NULL DEFAULT 1,
        ${AppConstants.colUnitPrice} REAL NOT NULL DEFAULT 0,
        ${AppConstants.colTotalPrice} REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (${AppConstants.colReceiptId}) REFERENCES ${AppConstants.tableReceipts} (${AppConstants.colId}) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE ${AppConstants.tableProductPrices} (
        ${AppConstants.colId} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${AppConstants.colProductName} TEXT NOT NULL,
        ${AppConstants.colPrice} REAL NOT NULL DEFAULT 0,
        ${AppConstants.colStoreName} TEXT,
        ${AppConstants.colLastUpdated} TEXT NOT NULL,
        UNIQUE(${AppConstants.colProductName}, ${AppConstants.colStoreName}, ${AppConstants.colLastUpdated})
      )
    ''');

    await _createTemplateTable(db);

    await db.execute('''
      CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id
      ON ${AppConstants.tableReceiptItems} (${AppConstants.colReceiptId})
    ''');

    await db.execute('''
      CREATE INDEX IF NOT EXISTS idx_product_prices_name
      ON ${AppConstants.tableProductPrices} (${AppConstants.colProductName})
    ''');

    // Insert default templates
    for (final template in ReceiptTemplate.defaultTemplates()) {
      await db.insert('receipt_templates', template.toMap());
    }
  }

  Future<void> _createTemplateTable(Database db) async {
    await db.execute('''
      CREATE TABLE receipt_templates (
        ${AppConstants.colId} INTEGER PRIMARY KEY AUTOINCREMENT,
        template_name TEXT NOT NULL,
        template_store_name TEXT DEFAULT '',
        name_pattern TEXT,
        barcode_pattern TEXT,
        price_pattern TEXT,
        name_group TEXT,
        barcode_group TEXT,
        qty_group TEXT,
        unit_price_group TEXT,
        total_price_group TEXT,
        skip_pattern TEXT,
        line_order TEXT,
        is_default INTEGER DEFAULT 0,
        ${AppConstants.colCreatedAt} TEXT NOT NULL
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await _addColumnIfNotExists(db, AppConstants.tableReceipts, AppConstants.colReceiptNumber, 'TEXT');
      await _addColumnIfNotExists(db, AppConstants.tableReceipts, AppConstants.colReceiptPhoto, 'TEXT');
    }
    if (oldVersion < 3) {
      await _createTemplateTable(db);
      final count = Sqflite.firstIntValue(
        await db.rawQuery('SELECT COUNT(*) FROM receipt_templates'),
      );
      if (count == 0) {
        for (final template in ReceiptTemplate.defaultTemplates()) {
          await db.insert('receipt_templates', template.toMap());
        }
      }
    }
    if (oldVersion < 4) {
      await _addColumnIfNotExists(db, AppConstants.tableReceiptItems, AppConstants.colBarcode, 'TEXT');
    }
    if (oldVersion < 6) {
      // Recreate template table with new schema (v6)
      await db.execute('DROP TABLE IF EXISTS receipt_templates');
      await _createTemplateTable(db);
      for (final template in ReceiptTemplate.defaultTemplates()) {
        await db.insert('receipt_templates', template.toMap());
      }
    }
  }

  Future<void> _addColumnIfNotExists(Database db, String table, String column, String type) async {
    final result = await db.rawQuery('PRAGMA table_info($table)');
    final exists = result.any((col) => col['name'] == column);
    if (!exists) {
      await db.execute('ALTER TABLE $table ADD COLUMN $column $type');
    }
  }

  Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
  }
}
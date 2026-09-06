import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:async';
import '../../core/constants/app_constants.dart';

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

    await db.execute('''
      CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id
      ON ${AppConstants.tableReceiptItems} (${AppConstants.colReceiptId})
    ''');

    await db.execute('''
      CREATE INDEX IF NOT EXISTS idx_product_prices_name
      ON ${AppConstants.tableProductPrices} (${AppConstants.colProductName})
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        ALTER TABLE ${AppConstants.tableReceipts}
        ADD COLUMN ${AppConstants.colReceiptNumber} TEXT
      ''');
      await db.execute('''
        ALTER TABLE ${AppConstants.tableReceipts}
        ADD COLUMN ${AppConstants.colReceiptPhoto} TEXT
      ''');
    }
  }

  Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
    }
  }
}
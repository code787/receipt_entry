import '../local/database_helper.dart';
import '../models/receipt_template.dart';
import '../../core/constants/app_constants.dart';

class TemplateRepository {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  Future<List<ReceiptTemplate>> getAllTemplates() async {
    final db = await _dbHelper.database;
    final maps = await db.query(AppConstants.tableReceiptTemplates, orderBy: 'is_default DESC, template_name ASC');
    return maps.map((m) => ReceiptTemplate.fromMap(m)).toList();
  }

  Future<ReceiptTemplate?> getTemplateById(int id) async {
    final db = await _dbHelper.database;
    final maps = await db.query(
      AppConstants.tableReceiptTemplates,
      where: '${AppConstants.colId} = ?',
      whereArgs: [id],
    );
    if (maps.isEmpty) return null;
    return ReceiptTemplate.fromMap(maps.first);
  }

  Future<int> insertTemplate(ReceiptTemplate template) async {
    final db = await _dbHelper.database;
    return await db.insert(AppConstants.tableReceiptTemplates, template.toMap());
  }

  Future<void> updateTemplate(ReceiptTemplate template) async {
    final db = await _dbHelper.database;
    await db.update(
      AppConstants.tableReceiptTemplates,
      template.toMap(),
      where: '${AppConstants.colId} = ?',
      whereArgs: [template.id],
    );
  }

  Future<void> deleteTemplate(int id) async {
    final db = await _dbHelper.database;
    await db.delete(
      AppConstants.tableReceiptTemplates,
      where: '${AppConstants.colId} = ?',
      whereArgs: [id],
    );
  }

  Future<void> setDefaultTemplate(int id) async {
    final db = await _dbHelper.database;
    await db.transaction((tx) async {
      await tx.update(AppConstants.tableReceiptTemplates, {'is_default': 0});
      await tx.update(
        AppConstants.tableReceiptTemplates,
        {'is_default': 1},
        where: '${AppConstants.colId} = ?',
        whereArgs: [id],
      );
    });
  }

  Future<ReceiptTemplate?> getDefaultTemplate() async {
    final db = await _dbHelper.database;
    final maps = await db.query(
      AppConstants.tableReceiptTemplates,
      where: 'is_default = 1',
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return ReceiptTemplate.fromMap(maps.first);
  }
}
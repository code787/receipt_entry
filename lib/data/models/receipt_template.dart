import '../../core/constants/app_constants.dart';

class ReceiptTemplate {
  final int? id;
  final String name;
  final String storeName;
  final String? itemPattern;
  final String? nameGroup;
  final String? barcodeGroup;
  final String? qtyGroup;
  final String? unitPriceGroup;
  final String? totalPriceGroup;
  final String? skipPattern;
  final bool isDefault;
  final DateTime createdAt;

  ReceiptTemplate({
    this.id,
    required this.name,
    this.storeName = '',
    this.itemPattern,
    this.nameGroup,
    this.barcodeGroup,
    this.qtyGroup,
    this.unitPriceGroup,
    this.totalPriceGroup,
    this.skipPattern,
    this.isDefault = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      AppConstants.colId: id,
      'template_name': name,
      'template_store_name': storeName,
      'item_pattern': itemPattern,
      'name_group': nameGroup,
      'barcode_group': barcodeGroup,
      'qty_group': qtyGroup,
      'unit_price_group': unitPriceGroup,
      'total_price_group': totalPriceGroup,
      'skip_pattern': skipPattern,
      'is_default': isDefault ? 1 : 0,
      AppConstants.colCreatedAt: createdAt.toIso8601String(),
    };
  }

  factory ReceiptTemplate.fromMap(Map<String, dynamic> map) {
    return ReceiptTemplate(
      id: map[AppConstants.colId],
      name: map['template_name'] ?? '',
      storeName: map['template_store_name'] ?? '',
      itemPattern: map['item_pattern'],
      nameGroup: map['name_group'],
      barcodeGroup: map['barcode_group'],
      qtyGroup: map['qty_group'],
      unitPriceGroup: map['unit_price_group'],
      totalPriceGroup: map['total_price_group'],
      skipPattern: map['skip_pattern'],
      isDefault: map['is_default'] == 1,
      createdAt: DateTime.parse(map[AppConstants.colCreatedAt]),
    );
  }

  ReceiptTemplate copyWith({
    int? id,
    String? name,
    String? storeName,
    String? itemPattern,
    String? nameGroup,
    String? barcodeGroup,
    String? qtyGroup,
    String? unitPriceGroup,
    String? totalPriceGroup,
    String? skipPattern,
    bool? isDefault,
  }) {
    return ReceiptTemplate(
      id: id ?? this.id,
      name: name ?? this.name,
      storeName: storeName ?? this.storeName,
      itemPattern: itemPattern ?? this.itemPattern,
      nameGroup: nameGroup ?? this.nameGroup,
      barcodeGroup: barcodeGroup ?? this.barcodeGroup,
      qtyGroup: qtyGroup ?? this.qtyGroup,
      unitPriceGroup: unitPriceGroup ?? this.unitPriceGroup,
      totalPriceGroup: totalPriceGroup ?? this.totalPriceGroup,
      skipPattern: skipPattern ?? this.skipPattern,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt,
    );
  }

  static List<ReceiptTemplate> defaultTemplates() {
    return [
      ReceiptTemplate(
        name: '通用模板',
        storeName: '',
        itemPattern: r'^(.+?)\s+[-—]?\s*[¥￥]?\s*(\d+\.?\d*)\s*$',
        nameGroup: '1',
        totalPriceGroup: '2',
        isDefault: true,
      ),
      ReceiptTemplate(
        name: '超市散称商品（含条码）',
        storeName: '',
        itemPattern: r'^(.+?/kg)\s+[-—]?\s*(\d+\.?\d*)\s*$',
        nameGroup: '1',
        totalPriceGroup: '2',
      ),
      ReceiptTemplate(
        name: '超市包装商品（含条码）',
        storeName: '',
        itemPattern: r'^(.+?)\s+(\d+)\.?\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*$',
        nameGroup: '1',
        qtyGroup: '2',
        unitPriceGroup: '3',
        totalPriceGroup: '4',
      ),
      ReceiptTemplate(
        name: '便利店格式',
        storeName: '',
        itemPattern: r'^(.+?)\s+(\d+)\s+[×xX]\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*$',
        nameGroup: '1',
        qtyGroup: '2',
        unitPriceGroup: '3',
        totalPriceGroup: '4',
      ),
    ];
  }
}
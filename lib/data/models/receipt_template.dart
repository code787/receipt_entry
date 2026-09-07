import '../../core/constants/app_constants.dart';

class ReceiptTemplate {
  final int? id;
  final String name;
  final String storeName;

  // 行类型正则：每种行类型的匹配模式
  final String? namePattern;      // 商品名行正则
  final String? barcodePattern;   // 条码行正则
  final String? pricePattern;     // 价格行正则
  final String? skipPattern;      // 需跳过的行

  // 字段提取：每种行类型中提取数据的分组编号
  // namePattern 中的商品名分组
  final String? nameGroup;
  // barcodePattern 中的条码分组
  final String? barcodeGroup;
  // pricePattern 中的数量/单价/金额分组
  final String? qtyGroup;
  final String? unitPriceGroup;
  final String? totalPriceGroup;

  // 行顺序：指定名行、条码行、价格行的出现顺序（逗号分隔）
  // 例如 "name,barcode,price" 表示先商品名、再条码、再价格
  // 支持 "name,price"（无条码）或 "name,barcode,price"（有条码）
  final String? lineOrder;

  final bool isDefault;
  final DateTime createdAt;

  ReceiptTemplate({
    this.id,
    required this.name,
    this.storeName = '',
    this.namePattern,
    this.barcodePattern,
    this.pricePattern,
    this.skipPattern,
    this.nameGroup,
    this.barcodeGroup,
    this.qtyGroup,
    this.unitPriceGroup,
    this.totalPriceGroup,
    this.lineOrder,
    this.isDefault = false,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  /// 解析 lineOrder 得到行类型顺序列表
  List<String> get parsedLineOrder {
    if (lineOrder == null || lineOrder!.isEmpty) {
      // 默认顺序：name → barcode → price
      return ['name', 'barcode', 'price'];
    }
    return lineOrder!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  Map<String, dynamic> toMap() {
    return {
      AppConstants.colId: id,
      'template_name': name,
      'template_store_name': storeName,
      'name_pattern': namePattern,
      'barcode_pattern': barcodePattern,
      'price_pattern': pricePattern,
      'skip_pattern': skipPattern,
      'name_group': nameGroup,
      'barcode_group': barcodeGroup,
      'qty_group': qtyGroup,
      'unit_price_group': unitPriceGroup,
      'total_price_group': totalPriceGroup,
      'line_order': lineOrder,
      'is_default': isDefault ? 1 : 0,
      AppConstants.colCreatedAt: createdAt.toIso8601String(),
    };
  }

  factory ReceiptTemplate.fromMap(Map<String, dynamic> map) {
    return ReceiptTemplate(
      id: map[AppConstants.colId],
      name: map['template_name'] ?? '',
      storeName: map['template_store_name'] ?? '',
      namePattern: map['name_pattern'],
      barcodePattern: map['barcode_pattern'],
      pricePattern: map['price_pattern'],
      skipPattern: map['skip_pattern'],
      nameGroup: map['name_group'],
      barcodeGroup: map['barcode_group'],
      qtyGroup: map['qty_group'],
      unitPriceGroup: map['unit_price_group'],
      totalPriceGroup: map['total_price_group'],
      lineOrder: map['line_order'],
      isDefault: map['is_default'] == 1,
      createdAt: DateTime.parse(map[AppConstants.colCreatedAt]),
    );
  }

  ReceiptTemplate copyWith({
    int? id,
    String? name,
    String? storeName,
    String? namePattern,
    String? barcodePattern,
    String? pricePattern,
    String? skipPattern,
    String? nameGroup,
    String? barcodeGroup,
    String? qtyGroup,
    String? unitPriceGroup,
    String? totalPriceGroup,
    String? lineOrder,
    bool? isDefault,
  }) {
    return ReceiptTemplate(
      id: id ?? this.id,
      name: name ?? this.name,
      storeName: storeName ?? this.storeName,
      namePattern: namePattern ?? this.namePattern,
      barcodePattern: barcodePattern ?? this.barcodePattern,
      pricePattern: pricePattern ?? this.pricePattern,
      skipPattern: skipPattern ?? this.skipPattern,
      nameGroup: nameGroup ?? this.nameGroup,
      barcodeGroup: barcodeGroup ?? this.barcodeGroup,
      qtyGroup: qtyGroup ?? this.qtyGroup,
      unitPriceGroup: unitPriceGroup ?? this.unitPriceGroup,
      totalPriceGroup: totalPriceGroup ?? this.totalPriceGroup,
      lineOrder: lineOrder ?? this.lineOrder,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt,
    );
  }

  /// 得瑞市厦门大悦城店 格式示例：
  /// 三元白雪原味酸奶100g/杯2123321003487   ← name行（含条码）
  /// 1    10.90 10.90                          ← price行
  static List<ReceiptTemplate> defaultTemplates() {
    return [
      // 得瑞市格式：商品名(可能含条码) + 价格行
      ReceiptTemplate(
        name: '得瑞市模板',
        storeName: '得瑞市',
        namePattern: r'^(.+?)(\d{11,14})?\s*$',
        nameGroup: '1',
        barcodeGroup: '2',
        pricePattern: r'^(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*$',
        qtyGroup: '1',
        unitPriceGroup: '2',
        totalPriceGroup: '3',
        skipPattern: r'品名|数量|单价|金额|合计|总计|单号|店号|工号|谢谢|欢迎',
        lineOrder: 'name,price',
        isDefault: true,
      ),
      // 超市散称商品：商品名 + 条码(下一行) + 价格(再下一行)
      ReceiptTemplate(
        name: '超市散称（含条码）',
        namePattern: r'^(.+?/kg)\s*$',
        nameGroup: '1',
        barcodePattern: r'^(\d{11,14})$',
        barcodeGroup: '1',
        pricePattern: r'^(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$',
        qtyGroup: '1',
        unitPriceGroup: '2',
        totalPriceGroup: '3',
        skipPattern: r'品名|数量|单价|金额|合计|总计',
        lineOrder: 'name,barcode,price',
      ),
      // 超市包装商品：商品名 + 条码 + 数量. 单价 金额
      ReceiptTemplate(
        name: '超市包装商品',
        namePattern: r'^(.+?)\s*$',
        nameGroup: '1',
        barcodePattern: r'^(\d{11,14})$',
        barcodeGroup: '1',
        pricePattern: r'^(\d+)\.?\s+(\d+\.?\d*)\s+(\d+\.?\d*)$',
        qtyGroup: '1',
        unitPriceGroup: '2',
        totalPriceGroup: '3',
        skipPattern: r'品名|数量|单价|金额|合计|总计',
        lineOrder: 'name,barcode,price',
      ),
      // 单行格式：商品名 + 数量 + 单价 + 金额（传统小票）
      ReceiptTemplate(
        name: '单行格式（传统小票）',
        namePattern: r'^(.+?)\s+(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*$',
        nameGroup: '1',
        qtyGroup: '2',
        unitPriceGroup: '3',
        totalPriceGroup: '4',
        skipPattern: r'品名|数量|单价|金额|合计|总计',
        lineOrder: 'name',
      ),
    ];
  }
}
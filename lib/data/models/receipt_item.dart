import '../../core/constants/app_constants.dart';

class ReceiptItem {
  final int? id;
  final int receiptId;
  final String productName;
  final String? barcode;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  ReceiptItem({
    this.id,
    required this.receiptId,
    required this.productName,
    this.barcode,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  Map<String, dynamic> toMap() {
    return {
      AppConstants.colId: id,
      AppConstants.colReceiptId: receiptId,
      AppConstants.colProductName: productName,
      AppConstants.colBarcode: barcode,
      AppConstants.colQuantity: quantity,
      AppConstants.colUnitPrice: unitPrice,
      AppConstants.colTotalPrice: totalPrice,
    };
  }

  factory ReceiptItem.fromMap(Map<String, dynamic> map) {
    return ReceiptItem(
      id: map[AppConstants.colId],
      receiptId: map[AppConstants.colReceiptId],
      productName: map[AppConstants.colProductName],
      barcode: map[AppConstants.colBarcode],
      quantity: map[AppConstants.colQuantity],
      unitPrice: (map[AppConstants.colUnitPrice] as num).toDouble(),
      totalPrice: (map[AppConstants.colTotalPrice] as num).toDouble(),
    );
  }

  ReceiptItem copyWith({
    int? id,
    int? receiptId,
    String? productName,
    String? barcode,
    int? quantity,
    double? unitPrice,
    double? totalPrice,
  }) {
    return ReceiptItem(
      id: id ?? this.id,
      receiptId: receiptId ?? this.receiptId,
      productName: productName ?? this.productName,
      barcode: barcode ?? this.barcode,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      totalPrice: totalPrice ?? this.totalPrice,
    );
  }
}
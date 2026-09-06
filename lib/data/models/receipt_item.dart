import '../../core/constants/app_constants.dart';

class ReceiptItem {
  final int? id;
  final int receiptId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  ReceiptItem({
    this.id,
    required this.receiptId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  Map<String, dynamic> toMap() {
    return {
      AppConstants.colId: id,
      AppConstants.colReceiptId: receiptId,
      AppConstants.colProductName: productName,
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
      quantity: map[AppConstants.colQuantity],
      unitPrice: (map[AppConstants.colUnitPrice] as num).toDouble(),
      totalPrice: (map[AppConstants.colTotalPrice] as num).toDouble(),
    );
  }
}

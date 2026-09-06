import '../../core/constants/app_constants.dart';

class ProductPrice {
  final int? id;
  final String productName;
  final double price;
  final String? storeName;
  final DateTime lastUpdated;

  ProductPrice({
    this.id,
    required this.productName,
    required this.price,
    this.storeName,
    DateTime? lastUpdated,
  }) : lastUpdated = lastUpdated ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      AppConstants.colId: id,
      AppConstants.colProductName: productName,
      AppConstants.colPrice: price,
      AppConstants.colStoreName: storeName,
      AppConstants.colLastUpdated: lastUpdated.toIso8601String(),
    };
  }

  factory ProductPrice.fromMap(Map<String, dynamic> map) {
    return ProductPrice(
      id: map[AppConstants.colId],
      productName: map[AppConstants.colProductName],
      price: (map[AppConstants.colPrice] as num).toDouble(),
      storeName: map[AppConstants.colStoreName],
      lastUpdated: DateTime.parse(map[AppConstants.colLastUpdated]),
    );
  }
}

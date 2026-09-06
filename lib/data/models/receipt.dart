import '../../core/constants/app_constants.dart';

class Receipt {
  final int? id;
  final String storeName;
  final String date;
  final String? note;
  final double totalAmount;
  final double theoreticalAmount;
  final DateTime createdAt;

  Receipt({
    this.id,
    required this.storeName,
    required this.date,
    this.note,
    required this.totalAmount,
    required this.theoreticalAmount,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      AppConstants.colId: id,
      AppConstants.colStoreName: storeName,
      AppConstants.colDate: date,
      AppConstants.colNote: note,
      AppConstants.colTotalPrice: totalAmount,
      AppConstants.colCreatedAt: createdAt.toIso8601String(),
    };
  }

  factory Receipt.fromMap(Map<String, dynamic> map) {
    return Receipt(
      id: map[AppConstants.colId],
      storeName: map[AppConstants.colStoreName],
      date: map[AppConstants.colDate],
      note: map[AppConstants.colNote],
      totalAmount: (map[AppConstants.colTotalPrice] as num).toDouble(),
      theoreticalAmount: map['${AppConstants.colTotalPrice}_theoretical'] != null
          ? (map['${AppConstants.colTotalPrice}_theoretical'] as num).toDouble()
          : 0.0,
      createdAt: DateTime.parse(map[AppConstants.colCreatedAt]),
    );
  }

  Receipt copyWith({
    int? id,
    String? storeName,
    String? date,
    String? note,
    double? totalAmount,
    double? theoreticalAmount,
    DateTime? createdAt,
  }) {
    return Receipt(
      id: id ?? this.id,
      storeName: storeName ?? this.storeName,
      date: date ?? this.date,
      note: note ?? this.note,
      totalAmount: totalAmount ?? this.totalAmount,
      theoreticalAmount: theoreticalAmount ?? this.theoreticalAmount,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

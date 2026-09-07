import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/receipt_repository.dart';
import '../data/repositories/template_repository.dart';
import '../data/models/product_price.dart';

final receiptRepositoryProvider = Provider<ReceiptRepository>((ref) {
  return ReceiptRepository();
});

final templateRepositoryProvider = Provider<TemplateRepository>((ref) {
  return TemplateRepository();
});

final receiptsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(receiptRepositoryProvider);
  return repo.getReceiptSummary();
});

final receiptDetailProvider = FutureProvider.family<Map<String, dynamic>?, int>((ref, int id) async {
  final repo = ref.watch(receiptRepositoryProvider);
  final receipt = await repo.getReceiptById(id);
  final items = await repo.getItemsByReceiptId(id);
  if (receipt == null) return null;
  return {...receipt.toMap(), 'items': items};
});

final productPricesProvider = FutureProvider<List<ProductPrice>>((ref) async {
  final repo = ref.watch(receiptRepositoryProvider);
  return repo.getAllProductPrices();
});

final priceComparisonProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(receiptRepositoryProvider);
  return repo.getPriceComparisonData();
});

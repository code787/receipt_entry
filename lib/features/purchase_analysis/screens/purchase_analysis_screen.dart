import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../providers/receipt_provider.dart';

class PurchaseAnalysisScreen extends ConsumerStatefulWidget {
  const PurchaseAnalysisScreen({super.key});

  @override
  ConsumerState<PurchaseAnalysisScreen> createState() => _PurchaseAnalysisScreenState();
}

class _PurchaseAnalysisScreenState extends ConsumerState<PurchaseAnalysisScreen> {
  @override
  Widget build(BuildContext context) {
    final receiptsAsync = ref.watch(receiptsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('金额分析')),
      body: receiptsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('错误: $err')),
        data: (receipts) {
          if (receipts.isEmpty) {
            return const Center(child: Text('暂无小票数据'));
          }
          double totalActual = 0;
          double totalTheoretical = 0;
          for (final r in receipts) {
            totalActual += (r['actual_total'] as num).toDouble();
            totalTheoretical += (r['theoretical_amount'] as num).toDouble();
          }
          final totalDiff = totalActual - totalTheoretical;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('汇总统计', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _StatCard(title: '小票数量', value: '${receipts.length}', color: Colors.teal),
                const SizedBox(height: 12),
                _StatCard(title: '实际总金额', value: '¥${totalActual.toStringAsFixed(2)}', color: Colors.blue),
                const SizedBox(height: 12),
                _StatCard(title: '理论总金额', value: '¥${totalTheoretical.toStringAsFixed(2)}', color: Colors.green),
                const SizedBox(height: 12),
                _StatCard(title: '总差额', value: '¥${totalDiff.toStringAsFixed(2)}', color: totalDiff.abs() > 0.01 ? Colors.red : Colors.green),
                const SizedBox(height: 24),
                const Text('小票明细', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ...receipts.map((r) {
                  final store = r['store_name'] as String;
                  final date = r['date'] as String;
                  final itemCount = r['item_count'] as int;
                  final actual = (r['actual_total'] as num).toDouble();
                  final theoretical = (r['theoretical_amount'] as num).toDouble();
                  final diff = actual - theoretical;
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: ExpansionTile(
                      title: Text(store, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('$date | $itemCount件商品'),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _InfoRow(label: '实际金额', value: '¥${actual.toStringAsFixed(2)}'),
                              _InfoRow(label: '理论金额', value: '¥${theoretical.toStringAsFixed(2)}'),
                              _InfoRow(
                                label: '差额',
                                value: '¥${diff.toStringAsFixed(2)}',
                                valueColor: diff.abs() > 0.01 ? Colors.red : Colors.green,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;
  const _StatCard({required this.title, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: color.withOpacity(0.1), // ignore: deprecated_member_use
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 14, color: Colors.grey[600])),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _InfoRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: valueColor)),
        ],
      ),
    );
  }
}

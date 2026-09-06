import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/product_price.dart';
import '../../../providers/receipt_provider.dart';

class PriceQueryScreen extends ConsumerStatefulWidget {
  const PriceQueryScreen({super.key});

  @override
  ConsumerState<PriceQueryScreen> createState() => _PriceQueryScreenState();
}

class _PriceQueryScreenState extends ConsumerState<PriceQueryScreen> with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  String _searchTerm = '';
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pricesAsync = ref.watch(productPricesProvider);
    final comparisonAsync = ref.watch(priceComparisonProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('价格查询'),
        bottom: TabBar(
          controller: _tabController,
          onTap: (i) => setState(() {}),
          tabs: const [
            Tab(text: '价格记录'),
            Tab(text: '比价分析'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: '搜索商品名称...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onChanged: (v) => setState(() => _searchTerm = v),
            ),
          ),
          Expanded(
            child: pricesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('错误: $err')),
              data: (prices) {
                if (_tabController.index == 0) {
                  return _buildPriceList(prices);
                }
                return comparisonAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, _) => Center(child: Text('错误: $err')),
                  data: (data) => _buildComparisonTable(data),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceList(List<ProductPrice> prices) {
    final filtered = _searchTerm.isEmpty
        ? prices
        : prices.where((p) => p.productName.contains(_searchTerm)).toList();
    if (filtered.isEmpty) {
      return const Center(child: Text('暂无价格记录'));
    }
    return ListView.builder(
      itemCount: filtered.length,
      itemBuilder: (ctx, i) {
        final price = filtered[i];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            title: Text(price.productName, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('¥${price.price.toStringAsFixed(2)}  | ${price.lastUpdated.toString().substring(0, 10)}${price.storeName != null ? ' | ${price.storeName}' : ''}'),
            trailing: const Icon(Icons.chevron_right),
          ),
        );
      },
    );
  }

  Widget _buildComparisonTable(List<Map<String, dynamic>> data) {
    if (data.isEmpty) {
      return const Center(child: Text('暂无比价数据'));
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: DataTable(
        columns: const [
          DataColumn(label: Text('商品')),
          DataColumn(label: Text('最低价')),
          DataColumn(label: Text('最高价')),
          DataColumn(label: Text('平均价')),
          DataColumn(label: Text('记录数')),
        ],
        rows: data.map((d) {
          final name = d['product_name'] as String;
          final minP = (d['min_price'] as num).toDouble();
          final maxP = (d['max_price'] as num).toDouble();
          final avgP = (d['avg_price'] as num).toDouble();
          final count = d['record_count'] as int;
          return DataRow(cells: [
            DataCell(Text(name)),
            DataCell(Text('¥${minP.toStringAsFixed(2)}')),
            DataCell(Text('¥${maxP.toStringAsFixed(2)}')),
            DataCell(Text('¥${avgP.toStringAsFixed(2)}')),
            DataCell(Text('$count')),
          ]);
        }).toList(),
      ),
    );
  }
}

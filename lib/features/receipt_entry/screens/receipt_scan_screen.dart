import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/receipt.dart';
import '../../../data/models/receipt_item.dart';
import '../../../data/models/receipt_template.dart';
import '../../../providers/receipt_provider.dart';
import '../../template_management/screens/template_management_screen.dart';
import '../services/ocr_service.dart';

class ReceiptScanScreen extends ConsumerStatefulWidget {
  final String photoPath;
  final List<ReceiptItem> initialItems;
  final String? initialStoreName;
  final String? initialReceiptNumber;

  const ReceiptScanScreen({
    super.key,
    required this.photoPath,
    this.initialItems = const [],
    this.initialStoreName,
    this.initialReceiptNumber,
  });

  @override
  ConsumerState<ReceiptScanScreen> createState() => _ReceiptScanScreenState();
}

class _ReceiptScanScreenState extends ConsumerState<ReceiptScanScreen> {
  late List<ReceiptItem> _items;
  final _storeNameController = TextEditingController();
  final _dateController = TextEditingController();
  final _noteController = TextEditingController();
  final _receiptNumberController = TextEditingController();
  String _selectedDate = '';
  bool _isProcessing = false;
  ReceiptTemplate? _selectedTemplate;
  List<ReceiptTemplate> _templates = [];

  @override
  void initState() {
    super.initState();
    _items = List.from(widget.initialItems);
    _selectedDate = DateTime.now().toString().substring(0, 10);
    _dateController.text = _selectedDate;
    if (widget.initialStoreName != null) {
      _storeNameController.text = widget.initialStoreName!;
    }
    if (widget.initialReceiptNumber != null) {
      _receiptNumberController.text = widget.initialReceiptNumber!;
    }
    _loadTemplates();
  }

  Future<void> _loadTemplates() async {
    final repo = ref.read(templateRepositoryProvider);
    final templates = await repo.getAllTemplates();
    final defaultTemplate = await repo.getDefaultTemplate();
    if (mounted) {
      setState(() {
        _templates = templates;
        _selectedTemplate = defaultTemplate;
      });
    }
  }

  @override
  void dispose() {
    _storeNameController.dispose();
    _dateController.dispose();
    _noteController.dispose();
    _receiptNumberController.dispose();
    super.dispose();
  }

  void _addItem() {
    showDialog(
      context: context,
      builder: (ctx) => _EditItemDialog(
        onSave: (name, barcode, qty, price) {
          setState(() {
            _items.add(ReceiptItem(
              receiptId: 0,
              productName: name,
              barcode: barcode,
              quantity: qty,
              unitPrice: price,
              totalPrice: qty * price,
            ));
          });
          Navigator.pop(ctx);
        },
      ),
    );
  }

  void _editItem(int index) {
    final item = _items[index];
    showDialog(
      context: context,
      builder: (ctx) => _EditItemDialog(
        initialName: item.productName,
        initialBarcode: item.barcode,
        initialQty: item.quantity.toString(),
        initialPrice: item.unitPrice.toString(),
        onSave: (name, barcode, qty, price) {
          setState(() {
            _items[index] = ReceiptItem(
              receiptId: item.receiptId,
              productName: name,
              barcode: barcode,
              quantity: qty,
              unitPrice: price,
              totalPrice: qty * price,
            );
          });
          Navigator.pop(ctx);
        },
      ),
    );
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  double get _totalAmount => _items.fold(0, (sum, item) => sum + item.totalPrice);

  Future<void> _importAll() async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请至少添加一个商品')),
      );
      return;
    }

    if (_receiptNumberController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入小票编号')),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final repo = ref.read(receiptRepositoryProvider);
      final receipt = Receipt(
        storeName: _storeNameController.text.isEmpty ? '扫描录入' : _storeNameController.text,
        date: _selectedDate,
        note: _noteController.text,
        receiptNumber: _receiptNumberController.text,
        photoPath: widget.photoPath,
        totalAmount: _totalAmount,
        theoreticalAmount: _totalAmount,
      );

      await repo.insertReceiptWithItems(receipt, _items);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('成功导入 ${_items.length} 条商品数据')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('导入失败: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _reparseWithTemplate() async {
    setState(() => _isProcessing = true);
    try {
      final ocrService = OcrService.instance;
      final items = await ocrService.parseReceiptItems(
        widget.photoPath,
        template: _selectedTemplate,
      );
      if (mounted) {
        setState(() {
          _items = items;
          _isProcessing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('重新识别到 ${items.length} 条商品')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('识别失败: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('扫描结果校对'),
        actions: [
          TextButton.icon(
            onPressed: _isProcessing ? null : _importAll,
            icon: _isProcessing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save),
            label: const Text('导入'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo preview with re-take button
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(widget.photoPath),
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: CircleAvatar(
                    backgroundColor: Colors.black54,
                    child: IconButton(
                      icon: const Icon(Icons.refresh, color: Colors.white),
                      onPressed: _reparseWithTemplate,
                      tooltip: '重新识别',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Template selector
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<ReceiptTemplate>(
                    initialValue: _selectedTemplate,
                    decoration: const InputDecoration(
                      labelText: '识别模板',
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      const DropdownMenuItem<ReceiptTemplate>(
                        value: null,
                        child: Text('默认模板'),
                      ),
                      ..._templates.map((t) => DropdownMenuItem<ReceiptTemplate>(
                        value: t,
                        child: Text(t.name),
                      )),
                    ],
                    onChanged: (template) {
                      setState(() => _selectedTemplate = template);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _reparseWithTemplate,
                  tooltip: '用当前模板重新识别',
                ),
                IconButton(
                  icon: const Icon(Icons.settings),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TemplateManagementScreen(),
                      ),
                    );
                    _loadTemplates();
                  },
                  tooltip: '管理模板',
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Store info
            TextField(
              controller: _storeNameController,
              decoration: const InputDecoration(
                labelText: '商店名称',
                border: OutlineInputBorder(),
                hintText: '可选',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _dateController,
              decoration: const InputDecoration(labelText: '日期', border: OutlineInputBorder()),
              readOnly: true,
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                );
                if (picked != null) {
                  setState(() {
                    _selectedDate = picked.toString().substring(0, 10);
                    _dateController.text = _selectedDate;
                  });
                }
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _receiptNumberController,
              decoration: const InputDecoration(
                labelText: '小票编号 *',
                border: OutlineInputBorder(),
                hintText: '必填',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: '备注', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),

            // Items section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '识别结果 (${_items.length}条)',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: _addItem,
                  tooltip: '添加商品',
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_items.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(
                    child: Text('未识别到商品数据，请手动添加', style: TextStyle(color: Colors.grey)),
                  ),
                ),
              )
            else
              ..._items.asMap().entries.map((entry) => Card(
                child: ListTile(
                  title: Text(entry.value.productName),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (entry.value.barcode != null)
                        Text(
                          '条码: ${entry.value.barcode}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      Text(
                        '${entry.value.quantity}件 × ¥${entry.value.unitPrice.toStringAsFixed(2)} = ¥${entry.value.totalPrice.toStringAsFixed(2)}',
                      ),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _editItem(entry.key),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                        onPressed: () => _removeItem(entry.key),
                      ),
                    ],
                  ),
                ),
              )),

            const SizedBox(height: 16),
            // Total
            Card(
              color: Colors.teal[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('合计金额:', style: TextStyle(fontSize: 16)),
                    Text(
                      '¥${_totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isProcessing ? null : _importAll,
                icon: _isProcessing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.save),
                label: const Text('确认导入'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditItemDialog extends StatefulWidget {
  final String? initialName;
  final String? initialBarcode;
  final String? initialQty;
  final String? initialPrice;
  final Function(String, String?, int, double) onSave;

  const _EditItemDialog({
    this.initialName,
    this.initialBarcode,
    this.initialQty,
    this.initialPrice,
    required this.onSave,
  });

  @override
  State<_EditItemDialog> createState() => __EditItemDialogState();
}

class __EditItemDialogState extends State<_EditItemDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _barcodeController;
  late final TextEditingController _qtyController;
  late final TextEditingController _priceController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName ?? '');
    _barcodeController = TextEditingController(text: widget.initialBarcode ?? '');
    _qtyController = TextEditingController(text: widget.initialQty ?? '1');
    _priceController = TextEditingController(text: widget.initialPrice ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _barcodeController.dispose();
    _qtyController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameController.text.trim();
    final barcode = _barcodeController.text.trim().isEmpty ? null : _barcodeController.text.trim();
    final qty = int.tryParse(_qtyController.text) ?? 1;
    final price = double.tryParse(_priceController.text) ?? 0.0;
    if (name.isEmpty || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入有效的商品信息')),
      );
      return;
    }
    widget.onSave(name, barcode, qty, price);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initialName != null ? '编辑商品' : '添加商品'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: '商品名称'),
            autofocus: true,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _barcodeController,
            decoration: const InputDecoration(labelText: '条码', hintText: '可选'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _qtyController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: '数量'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _priceController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: '单价'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('取消'),
        ),
        FilledButton(onPressed: _save, child: const Text('保存')),
      ],
    );
  }
}
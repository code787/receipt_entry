import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'dart:io' as io;
import '../../../data/models/receipt.dart';
import '../../../data/models/receipt_item.dart';
import '../../../providers/receipt_provider.dart';

class ReceiptEntryScreen extends ConsumerStatefulWidget {
  const ReceiptEntryScreen({super.key});

  @override
  ConsumerState<ReceiptEntryScreen> createState() => _ReceiptEntryScreenState();
}

class _ReceiptEntryScreenState extends ConsumerState<ReceiptEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _storeNameController = TextEditingController();
  final _dateController = TextEditingController();
  final _noteController = TextEditingController();
  final _receiptNumberController = TextEditingController();

  final List<ReceiptItem> _items = [];
  String _selectedDate = '';
  String? _photoPath;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().toString().substring(0, 10);
    _dateController.text = _selectedDate;
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
      builder: (ctx) => _AddItemDialog(
        onAdd: (name, qty, price) {
          setState(() {
            _items.add(ReceiptItem(
              receiptId: 0,
              productName: name,
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

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  Future<void> _takePhoto() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (photo != null) {
      final appDir = await getApplicationDocumentsDirectory();
      final photoDir = Directory(p.join(appDir.path, 'receipt_photos'));
      if (!await photoDir.exists()) {
        await photoDir.create(recursive: true);
      }
      final fileName = 'receipt_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final savedPath = p.join(photoDir.path, fileName);
      await io.File(photo.path).copy(savedPath);
      setState(() => _photoPath = savedPath);
    }
  }

  void _removePhoto() {
    setState(() => _photoPath = null);
  }

  double get _actualTotal => _items.fold(0, (sum, item) => sum + item.totalPrice);
  double get _theoreticalTotal => _items.fold(0, (sum, item) => sum + item.quantity * item.unitPrice);

  Future<void> _submit() async {
    if (_items.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('请至少录入一个商品')),
        );
      }
      return;
    }
    final repo = ref.read(receiptRepositoryProvider);
    final receipt = Receipt(
      storeName: _storeNameController.text,
      date: _selectedDate,
      note: _noteController.text,
      receiptNumber: _receiptNumberController.text.isEmpty ? null : _receiptNumberController.text,
      photoPath: _photoPath,
      totalAmount: _actualTotal,
      theoreticalAmount: _theoreticalTotal,
    );
    try {
      await repo.insertReceiptWithItems(receipt, _items);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('小票录入成功')),
        );
        _storeNameController.clear();
        _noteController.clear();
        _receiptNumberController.clear();
        setState(() {
          _items.clear();
          _photoPath = null;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('录入失败: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('小票录入')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _storeNameController,
                decoration: const InputDecoration(labelText: '商店名称', border: OutlineInputBorder()),
                validator: (v) => v == null || v.isEmpty ? '请输入商店名称' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
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
              TextFormField(
                controller: _receiptNumberController,
                decoration: const InputDecoration(
                  labelText: '小票编号',
                  border: OutlineInputBorder(),
                  hintText: '可选',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _noteController,
                decoration: const InputDecoration(labelText: '备注', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),

              // Photo section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('小票照片', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.camera_alt),
                        onPressed: _takePhoto,
                        tooltip: '拍照',
                      ),
                      if (_photoPath != null)
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: _removePhoto,
                          tooltip: '删除照片',
                        ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_photoPath != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(_photoPath!),
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                )
              else
                GestureDetector(
                  onTap: _takePhoto,
                  child: Container(
                    height: 150,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.camera_alt, size: 48, color: Colors.grey),
                        SizedBox(height: 8),
                        Text('点击拍照', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),

              // Items section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('商品列表', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.add), onPressed: _addItem, tooltip: '添加商品'),
                ],
              ),
              const SizedBox(height: 8),
              ..._items.asMap().entries.map((entry) => Dismissible(
                key: Key(entry.key.toString()),
                direction: DismissDirection.endToStart,
                onDismissed: (_) => _removeItem(entry.key),
                background: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 20), child: const Icon(Icons.delete, color: Colors.white)),
                child: Card(
                  child: ListTile(
                    title: Text(entry.value.productName),
                    subtitle: Text('${entry.value.quantity}件 × ¥${entry.value.unitPrice.toStringAsFixed(2)} = ¥${entry.value.totalPrice.toStringAsFixed(2)}'),
                    trailing: const Icon(Icons.drag_handle),
                  ),
                ),
              )),
              const SizedBox(height: 16),
              Card(
                color: Colors.teal[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('实际金额: ¥${_actualTotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16)),
                      Text('理论金额: ¥${_theoreticalTotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16)),
                      Text('差额: ¥${(_actualTotal - _theoreticalTotal).toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 16, color: (_actualTotal - _theoreticalTotal).abs() > 0.01 ? Colors.red : Colors.green)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _submit,
                icon: const Icon(Icons.save),
                label: const Text('提交小票'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AddItemDialog extends StatefulWidget {
  final Function(String, int, double) onAdd;
  const _AddItemDialog({required this.onAdd});

  @override
  State<_AddItemDialog> createState() => __AddItemDialogState();
}

class __AddItemDialogState extends State<_AddItemDialog> {
  final _nameController = TextEditingController();
  final _qtyController = TextEditingController();
  final _priceController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _qtyController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameController.text.trim();
    final qty = int.tryParse(_qtyController.text) ?? 1;
    final price = double.tryParse(_priceController.text) ?? 0.0;
    if (name.isEmpty || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入有效的商品信息')));
      return;
    }
    widget.onAdd(name, qty, price);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('添加商品'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: _nameController, decoration: const InputDecoration(labelText: '商品名称'), autofocus: true),
          const SizedBox(height: 8),
          TextField(controller: _qtyController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '数量')),
          const SizedBox(height: 8),
          TextField(controller: _priceController, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '单价')),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('取消')),
        FilledButton(onPressed: _save, child: const Text('添加')),
      ],
    );
  }
}
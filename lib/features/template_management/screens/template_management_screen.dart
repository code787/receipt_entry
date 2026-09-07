import 'package:flutter/material.dart';
import '../../../data/models/receipt_template.dart';
import '../../../data/repositories/template_repository.dart';

class TemplateManagementScreen extends StatefulWidget {
  const TemplateManagementScreen({super.key});

  @override
  State<TemplateManagementScreen> createState() => _TemplateManagementScreenState();
}

class _TemplateManagementScreenState extends State<TemplateManagementScreen> {
  List<ReceiptTemplate> _templates = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  Future<void> _loadTemplates() async {
    final repo = TemplateRepository();
    final templates = await repo.getAllTemplates();
    if (mounted) {
      setState(() {
        _templates = templates;
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteTemplate(ReceiptTemplate template) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除模板「${template.name}」吗？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirmed == true) {
      final repo = TemplateRepository();
      await repo.deleteTemplate(template.id!);
      _loadTemplates();
    }
  }

  Future<void> _editTemplate(ReceiptTemplate? template) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => TemplateEditScreen(template: template),
      ),
    );
    if (result == true) {
      _loadTemplates();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('模板管理'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _editTemplate(null),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _templates.isEmpty
              ? const Center(child: Text('暂无模板，请点击右上角添加'))
              : ListView.builder(
                  itemCount: _templates.length,
                  itemBuilder: (context, index) {
                    final template = _templates[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ListTile(
                        title: Text(template.name),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (template.storeName.isNotEmpty)
                              Text('商店: ${template.storeName}', style: const TextStyle(fontSize: 12)),
                            const SizedBox(height: 4),
                            _buildPatternInfo('商品名', template.namePattern, template.nameGroup),
                            if (template.barcodePattern != null)
                              _buildPatternInfo('条码', template.barcodePattern, template.barcodeGroup),
                            _buildPatternInfo('价格', template.pricePattern, template.qtyGroup),
                            Text(
                              '行顺序: ${template.lineOrder ?? "name,barcode,price"}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (template.isDefault)
                              const Chip(label: Text('默认', style: TextStyle(fontSize: 10))),
                            IconButton(
                              icon: const Icon(Icons.edit, size: 20),
                              onPressed: () => _editTemplate(template),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                              onPressed: () => _deleteTemplate(template),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildPatternInfo(String label, String? pattern, String? group) {
    if (pattern == null || pattern.isEmpty) return const SizedBox.shrink();
    final display = pattern.length > 40 ? '${pattern.substring(0, 40)}...' : pattern;
    return Text(
      '$label: $display (组${group ?? '-'})',
      style: const TextStyle(fontSize: 11, color: Colors.grey),
      overflow: TextOverflow.ellipsis,
    );
  }
}

class TemplateEditScreen extends StatefulWidget {
  final ReceiptTemplate? template;

  const TemplateEditScreen({super.key, this.template});

  @override
  State<TemplateEditScreen> createState() => _TemplateEditScreenState();
}

class _TemplateEditScreenState extends State<TemplateEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _storeNameController;
  late final TextEditingController _namePatternController;
  late final TextEditingController _nameGroupController;
  late final TextEditingController _barcodePatternController;
  late final TextEditingController _barcodeGroupController;
  late final TextEditingController _pricePatternController;
  late final TextEditingController _qtyGroupController;
  late final TextEditingController _unitPriceGroupController;
  late final TextEditingController _totalPriceGroupController;
  late final TextEditingController _skipPatternController;
  late final TextEditingController _lineOrderController;
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final t = widget.template;
    _nameController = TextEditingController(text: t?.name ?? '');
    _storeNameController = TextEditingController(text: t?.storeName ?? '');
    _namePatternController = TextEditingController(text: t?.namePattern ?? '');
    _nameGroupController = TextEditingController(text: t?.nameGroup ?? '1');
    _barcodePatternController = TextEditingController(text: t?.barcodePattern ?? '');
    _barcodeGroupController = TextEditingController(text: t?.barcodeGroup ?? '1');
    _pricePatternController = TextEditingController(text: t?.pricePattern ?? '');
    _qtyGroupController = TextEditingController(text: t?.qtyGroup ?? '');
    _unitPriceGroupController = TextEditingController(text: t?.unitPriceGroup ?? '');
    _totalPriceGroupController = TextEditingController(text: t?.totalPriceGroup ?? '');
    _skipPatternController = TextEditingController(text: t?.skipPattern ?? '');
    _lineOrderController = TextEditingController(text: t?.lineOrder ?? 'name,barcode,price');
    _isDefault = t?.isDefault ?? false;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _storeNameController.dispose();
    _namePatternController.dispose();
    _nameGroupController.dispose();
    _barcodePatternController.dispose();
    _barcodeGroupController.dispose();
    _pricePatternController.dispose();
    _qtyGroupController.dispose();
    _unitPriceGroupController.dispose();
    _totalPriceGroupController.dispose();
    _skipPatternController.dispose();
    _lineOrderController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final template = ReceiptTemplate(
      id: widget.template?.id,
      name: _nameController.text,
      storeName: _storeNameController.text,
      namePattern: _namePatternController.text.isEmpty ? null : _namePatternController.text,
      nameGroup: _nameGroupController.text.isEmpty ? null : _nameGroupController.text,
      barcodePattern: _barcodePatternController.text.isEmpty ? null : _barcodePatternController.text,
      barcodeGroup: _barcodeGroupController.text.isEmpty ? null : _barcodeGroupController.text,
      pricePattern: _pricePatternController.text.isEmpty ? null : _pricePatternController.text,
      qtyGroup: _qtyGroupController.text.isEmpty ? null : _qtyGroupController.text,
      unitPriceGroup: _unitPriceGroupController.text.isEmpty ? null : _unitPriceGroupController.text,
      totalPriceGroup: _totalPriceGroupController.text.isEmpty ? null : _totalPriceGroupController.text,
      skipPattern: _skipPatternController.text.isEmpty ? null : _skipPatternController.text,
      lineOrder: _lineOrderController.text.isEmpty ? null : _lineOrderController.text,
      isDefault: _isDefault,
    );

    final repo = TemplateRepository();
    if (template.id != null) {
      await repo.updateTemplate(template);
    } else {
      await repo.insertTemplate(template);
    }

    if (mounted) {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.template != null ? '编辑模板' : '新建模板'),
        actions: [
          TextButton(onPressed: _save, child: const Text('保存')),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: '模板名称 *',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => v == null || v.isEmpty ? '请输入模板名称' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _storeNameController,
                decoration: const InputDecoration(
                  labelText: '商店名称',
                  border: OutlineInputBorder(),
                  hintText: '可选，匹配特定商店',
                ),
              ),
              const SizedBox(height: 20),

              // 行顺序
              const Text('行顺序', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('指定小票中各行类型的出现顺序，逗号分隔',
                  style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _lineOrderController,
                decoration: const InputDecoration(
                  labelText: '行顺序',
                  border: OutlineInputBorder(),
                  hintText: 'name,barcode,price',
                  helperText: 'name=商品名行, barcode=条码行, price=价格行',
                ),
              ),
              const SizedBox(height: 20),

              // 商品名行
              const Text('商品名行', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _namePatternController,
                decoration: const InputDecoration(
                  labelText: '商品名行正则',
                  border: OutlineInputBorder(),
                  hintText: r'^(.+?)(\d{11,14})?\s*$',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameGroupController,
                decoration: const InputDecoration(
                  labelText: '商品名分组号',
                  border: OutlineInputBorder(),
                  hintText: '1',
                ),
              ),
              const SizedBox(height: 20),

              // 条码行
              const Text('条码行', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('如果商品名行已含条码，可留空',
                  style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _barcodePatternController,
                decoration: const InputDecoration(
                  labelText: '条码行正则',
                  border: OutlineInputBorder(),
                  hintText: r'^(\d{11,14})$',
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _barcodeGroupController,
                decoration: const InputDecoration(
                  labelText: '条码分组号',
                  border: OutlineInputBorder(),
                  hintText: '1',
                ),
              ),
              const SizedBox(height: 20),

              // 价格行
              const Text('价格行', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _pricePatternController,
                decoration: const InputDecoration(
                  labelText: '价格行正则',
                  border: OutlineInputBorder(),
                  hintText: r'^(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*$',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _qtyGroupController,
                      decoration: const InputDecoration(
                        labelText: '数量分组号',
                        border: OutlineInputBorder(),
                        hintText: '可选',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _unitPriceGroupController,
                      decoration: const InputDecoration(
                        labelText: '单价分组号',
                        border: OutlineInputBorder(),
                        hintText: '可选',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _totalPriceGroupController,
                      decoration: const InputDecoration(
                        labelText: '金额分组号',
                        border: OutlineInputBorder(),
                        hintText: '可选',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // 跳过规则
              const Text('跳过规则', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _skipPatternController,
                decoration: const InputDecoration(
                  labelText: '跳过行正则',
                  border: OutlineInputBorder(),
                  hintText: '品名|合计|总计|单号',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),

              SwitchListTile(
                title: const Text('设为默认模板'),
                value: _isDefault,
                onChanged: (v) => setState(() => _isDefault = v),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
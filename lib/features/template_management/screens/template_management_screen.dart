import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/receipt_template.dart';
import '../../../data/repositories/template_repository.dart';

final templateRepositoryProvider = Provider<TemplateRepository>((ref) {
  return TemplateRepository();
});

final templatesProvider = FutureProvider<List<ReceiptTemplate>>((ref) async {
  final repo = ref.watch(templateRepositoryProvider);
  return repo.getAllTemplates();
});

class TemplateManagementScreen extends ConsumerStatefulWidget {
  const TemplateManagementScreen({super.key});

  @override
  ConsumerState<TemplateManagementScreen> createState() => _TemplateManagementScreenState();
}

class _TemplateManagementScreenState extends ConsumerState<TemplateManagementScreen> {
  @override
  Widget build(BuildContext context) {
    final templatesAsync = ref.watch(templatesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('识别模板管理'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _editTemplate(context, null),
          ),
        ],
      ),
      body: templatesAsync.when(
        data: (templates) {
          if (templates.isEmpty) {
            return const Center(child: Text('暂无模板'));
          }
          return ListView.builder(
            itemCount: templates.length,
            itemBuilder: (context, index) {
              final template = templates[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: ListTile(
                  title: Row(
                    children: [
                      Text(template.name),
                      if (template.isDefault) ...[
                        const SizedBox(width: 8),
                        Chip(
                          label: const Text('默认', style: TextStyle(fontSize: 12)),
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ],
                  ),
                  subtitle: Text(
                    template.storeName.isNotEmpty ? template.storeName : '通用模板',
                    style: const TextStyle(color: Colors.grey),
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) => _handleMenuAction(value, template),
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: 'edit', child: Text('编辑')),
                      if (!template.isDefault)
                        const PopupMenuItem(value: 'setDefault', child: Text('设为默认')),
                      const PopupMenuItem(value: 'delete', child: Text('删除')),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('加载失败: $e')),
      ),
    );
  }

  void _handleMenuAction(String action, ReceiptTemplate template) async {
    final repo = ref.read(templateRepositoryProvider);
    switch (action) {
      case 'edit':
        _editTemplate(context, template);
        break;
      case 'setDefault':
        await repo.setDefaultTemplate(template.id!);
        ref.invalidate(templatesProvider);
        break;
      case 'delete':
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('确认删除'),
            content: Text('确定要删除模板"${template.name}"吗？'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除')),
            ],
          ),
        );
        if (confirmed == true) {
          await repo.deleteTemplate(template.id!);
          ref.invalidate(templatesProvider);
        }
        break;
    }
  }

  void _editTemplate(BuildContext context, ReceiptTemplate? template) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => TemplateEditScreen(template: template),
      ),
    );
    if (result == true) {
      ref.invalidate(templatesProvider);
    }
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
  late final TextEditingController _itemPatternController;
  late final TextEditingController _nameGroupController;
  late final TextEditingController _barcodeGroupController;
  late final TextEditingController _qtyGroupController;
  late final TextEditingController _unitPriceGroupController;
  late final TextEditingController _totalPriceGroupController;
  late final TextEditingController _skipPatternController;
  bool _isDefault = false;

  @override
  void initState() {
    super.initState();
    final t = widget.template;
    _nameController = TextEditingController(text: t?.name ?? '');
    _storeNameController = TextEditingController(text: t?.storeName ?? '');
    _itemPatternController = TextEditingController(text: t?.itemPattern ?? '');
    _nameGroupController = TextEditingController(text: t?.nameGroup ?? '1');
    _barcodeGroupController = TextEditingController(text: t?.barcodeGroup ?? '');
    _qtyGroupController = TextEditingController(text: t?.qtyGroup ?? '');
    _unitPriceGroupController = TextEditingController(text: t?.unitPriceGroup ?? '');
    _totalPriceGroupController = TextEditingController(text: t?.totalPriceGroup ?? '');
    _skipPatternController = TextEditingController(text: t?.skipPattern ?? '');
    _isDefault = t?.isDefault ?? false;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _storeNameController.dispose();
    _itemPatternController.dispose();
    _nameGroupController.dispose();
    _barcodeGroupController.dispose();
    _qtyGroupController.dispose();
    _unitPriceGroupController.dispose();
    _totalPriceGroupController.dispose();
    _skipPatternController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final template = ReceiptTemplate(
      id: widget.template?.id,
      name: _nameController.text,
      storeName: _storeNameController.text,
      itemPattern: _itemPatternController.text.isEmpty ? null : _itemPatternController.text,
      nameGroup: _nameGroupController.text.isEmpty ? null : _nameGroupController.text,
      barcodeGroup: _barcodeGroupController.text.isEmpty ? null : _barcodeGroupController.text,
      qtyGroup: _qtyGroupController.text.isEmpty ? null : _qtyGroupController.text,
      unitPriceGroup: _unitPriceGroupController.text.isEmpty ? null : _unitPriceGroupController.text,
      totalPriceGroup: _totalPriceGroupController.text.isEmpty ? null : _totalPriceGroupController.text,
      skipPattern: _skipPatternController.text.isEmpty ? null : _skipPatternController.text,
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
              const SizedBox(height: 16),

              const Text('匹配规则', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _itemPatternController,
                decoration: const InputDecoration(
                  labelText: '商品行正则表达式',
                  border: OutlineInputBorder(),
                  hintText: r'^(.+?)\s+(\d+\.?\d*)$',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),

              const Text('字段提取（正则分组编号）', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _nameGroupController,
                      decoration: const InputDecoration(
                        labelText: '商品名组号',
                        border: OutlineInputBorder(),
                        hintText: '1',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _barcodeGroupController,
                      decoration: const InputDecoration(
                        labelText: '条码组号',
                        border: OutlineInputBorder(),
                        hintText: '可选',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _qtyGroupController,
                      decoration: const InputDecoration(
                        labelText: '数量组号',
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
                        labelText: '单价组号',
                        border: OutlineInputBorder(),
                        hintText: '可选',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _totalPriceGroupController,
                      decoration: const InputDecoration(
                        labelText: '金额组号',
                        border: OutlineInputBorder(),
                        hintText: '2',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _skipPatternController,
                decoration: const InputDecoration(
                  labelText: '跳过行正则',
                  border: OutlineInputBorder(),
                  hintText: r'(合计|单号|条码|\d{11,14})',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('设为默认模板'),
                value: _isDefault,
                onChanged: (v) => setState(() => _isDefault = v),
              ),
              const SizedBox(height: 16),

              // Help section
              Card(
                color: Colors.blue[50],
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('使用说明', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text('• 正则表达式中用 () 捕获字段', style: Theme.of(context).textTheme.bodySmall),
                      Text('• 分组编号从1开始', style: Theme.of(context).textTheme.bodySmall),
                      Text(r'• 示例: ^(.+?)\s+(\d+\.?\d*)$', style: Theme.of(context).textTheme.bodySmall),
                      Text('  商品名=组1, 金额=组2', style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
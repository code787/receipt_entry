import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';
import { ReceiptTemplate } from '../../types';
import { storage } from '../../data/storage';

interface TemplateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesChanged?: () => void;
}

export const TemplateManagementModal: React.FC<TemplateManagementModalProps> = ({
  isOpen,
  onClose,
  onTemplatesChanged,
}) => {
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ReceiptTemplate | null | 'new'>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [lineOrder, setLineOrder] = useState('name,barcode,price');
  const [namePattern, setNamePattern] = useState('');
  const [nameGroup, setNameGroup] = useState('1');
  const [barcodePattern, setBarcodePattern] = useState('');
  const [barcodeGroup, setBarcodeGroup] = useState('1');
  const [pricePattern, setPricePattern] = useState('');
  const [qtyGroup, setQtyGroup] = useState('1');
  const [unitPriceGroup, setUnitPriceGroup] = useState('2');
  const [totalPriceGroup, setTotalPriceGroup] = useState('3');
  const [skipPattern, setSkipPattern] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState('');

  const loadTemplates = () => {
    const list = storage.getAllTemplates();
    setTemplates(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setEditingTemplate(null);
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  const openEditor = (template: ReceiptTemplate | null) => {
    setFormError('');
    if (template) {
      setEditingTemplate(template);
      setName(template.name || '');
      setStoreName(template.storeName || '');
      setLineOrder(template.lineOrder || 'name,barcode,price');
      setNamePattern(template.namePattern || '');
      setNameGroup(template.nameGroup || '1');
      setBarcodePattern(template.barcodePattern || '');
      setBarcodeGroup(template.barcodeGroup || '1');
      setPricePattern(template.pricePattern || '');
      setQtyGroup(template.qtyGroup || '');
      setUnitPriceGroup(template.unitPriceGroup || '');
      setTotalPriceGroup(template.totalPriceGroup || '');
      setSkipPattern(template.skipPattern || '');
      setIsDefault(template.isDefault || false);
    } else {
      setEditingTemplate('new');
      setName('');
      setStoreName('');
      setLineOrder('name,barcode,price');
      setNamePattern('^(.+?)\\s*$');
      setNameGroup('1');
      setBarcodePattern('^(\\d{11,14})$');
      setBarcodeGroup('1');
      setPricePattern('^(\\d+)\\s+(\\d+\\.?\\d*)\\s+(\\d+\\.?\\d*)$');
      setQtyGroup('1');
      setUnitPriceGroup('2');
      setTotalPriceGroup('3');
      setSkipPattern('品名|数量|单价|金额|合计|总计');
      setIsDefault(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('请输入模板名称');
      return;
    }

    try {
      if (namePattern) new RegExp(namePattern);
      if (barcodePattern) new RegExp(barcodePattern);
      if (pricePattern) new RegExp(pricePattern);
      if (skipPattern) new RegExp(skipPattern);
    } catch (err) {
      setFormError(`正则表达式格式错误: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    if (editingTemplate === 'new') {
      storage.insertTemplate({
        name: name.trim(),
        storeName: storeName.trim(),
        lineOrder: lineOrder.trim() || undefined,
        namePattern: namePattern.trim() || undefined,
        nameGroup: nameGroup.trim() || undefined,
        barcodePattern: barcodePattern.trim() || undefined,
        barcodeGroup: barcodeGroup.trim() || undefined,
        pricePattern: pricePattern.trim() || undefined,
        qtyGroup: qtyGroup.trim() || undefined,
        unitPriceGroup: unitPriceGroup.trim() || undefined,
        totalPriceGroup: totalPriceGroup.trim() || undefined,
        skipPattern: skipPattern.trim() || undefined,
        isDefault,
        createdAt: new Date().toISOString(),
      });
    } else if (editingTemplate && typeof editingTemplate === 'object') {
      storage.updateTemplate({
        ...editingTemplate,
        name: name.trim(),
        storeName: storeName.trim(),
        lineOrder: lineOrder.trim() || undefined,
        namePattern: namePattern.trim() || undefined,
        nameGroup: nameGroup.trim() || undefined,
        barcodePattern: barcodePattern.trim() || undefined,
        barcodeGroup: barcodeGroup.trim() || undefined,
        pricePattern: pricePattern.trim() || undefined,
        qtyGroup: qtyGroup.trim() || undefined,
        unitPriceGroup: unitPriceGroup.trim() || undefined,
        totalPriceGroup: totalPriceGroup.trim() || undefined,
        skipPattern: skipPattern.trim() || undefined,
        isDefault,
      });
    }

    loadTemplates();
    setEditingTemplate(null);
    onTemplatesChanged?.();
  };

  const handleDelete = (id: number) => {
    storage.deleteTemplate(id);
    setDeleteConfirmId(null);
    loadTemplates();
    onTemplatesChanged?.();
  };

  const handleSetDefault = (id: number) => {
    storage.setDefaultTemplate(id);
    loadTemplates();
    onTemplatesChanged?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5" />
            <h2 className="text-lg font-bold">模板管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-teal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {editingTemplate ? (
            /* Template Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">
                  {editingTemplate === 'new' ? '新建模板' : `编辑模板: ${typeof editingTemplate === 'object' ? editingTemplate.name : ''}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-slate-100"
                >
                  返回列表
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    模板名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如: 某某超市模板"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">商店名称 (可选)</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="匹配特定商店"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">行顺序 (逗号分隔)</label>
                <input
                  type="text"
                  value={lineOrder}
                  onChange={(e) => setLineOrder(e.target.value)}
                  placeholder="name,barcode,price"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  可选: name(商品名行), barcode(条码行), price(价格行)
                </p>
              </div>

              {/* Product Name Regex */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-xs text-slate-800">商品名行规则</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">商品名行正则表达式</label>
                    <input
                      type="text"
                      value={namePattern}
                      onChange={(e) => setNamePattern(e.target.value)}
                      placeholder="^(.+?)(\d{11,14})?\s*$"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">商品名分组号</label>
                    <input
                      type="text"
                      value={nameGroup}
                      onChange={(e) => setNameGroup(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Barcode Regex */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-xs text-slate-800">条码行规则</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">条码行正则 (若商品名已含条码可留空)</label>
                    <input
                      type="text"
                      value={barcodePattern}
                      onChange={(e) => setBarcodePattern(e.target.value)}
                      placeholder="^(\d{11,14})$"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">条码分组号</label>
                    <input
                      type="text"
                      value={barcodeGroup}
                      onChange={(e) => setBarcodeGroup(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Price Regex */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-xs text-slate-800">价格行规则</div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">价格行正则表达式</label>
                  <input
                    type="text"
                    value={pricePattern}
                    onChange={(e) => setPricePattern(e.target.value)}
                    placeholder="^(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*$"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">数量分组号</label>
                    <input
                      type="text"
                      value={qtyGroup}
                      onChange={(e) => setQtyGroup(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">单价分组号</label>
                    <input
                      type="text"
                      value={unitPriceGroup}
                      onChange={(e) => setUnitPriceGroup(e.target.value)}
                      placeholder="2"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">金额分组号</label>
                    <input
                      type="text"
                      value={totalPriceGroup}
                      onChange={(e) => setTotalPriceGroup(e.target.value)}
                      placeholder="3"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Skip Pattern */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">跳过行规则 (正则)</label>
                <input
                  type="text"
                  value={skipPattern}
                  onChange={(e) => setSkipPattern(e.target.value)}
                  placeholder="品名|合计|总计|单号|欢迎"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="isDefaultCheckbox" className="text-sm font-medium text-slate-700">
                  设为默认识别模板
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  保存模板
                </button>
              </div>
            </form>
          ) : (
            /* Template List */
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs text-slate-500">
                  共有 <span className="font-semibold text-slate-700">{templates.length}</span> 个识别模板
                </div>
                <button
                  onClick={() => openEditor(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新建模板
                </button>
              </div>

              <div className="space-y-3">
                {templates.map((tpl, idx) => (
                  <div
                    key={`manage-tpl-${tpl.id}-${idx}`}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{tpl.name}</h4>
                          {tpl.isDefault && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                              默认模板
                            </span>
                          )}
                        </div>
                        {tpl.storeName && (
                          <div className="text-xs text-slate-500 mt-0.5">商店: {tpl.storeName}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!tpl.isDefault && (
                          <button
                            onClick={() => handleSetDefault(tpl.id)}
                            title="设为默认"
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditor(tpl)}
                          title="编辑模板"
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tpl.id)}
                          title="删除模板"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pattern info */}
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5 font-mono">
                      {tpl.namePattern && (
                        <div className="truncate">
                          <span className="text-slate-400">商品名:</span> {tpl.namePattern} (组{tpl.nameGroup || '-'})
                        </div>
                      )}
                      {tpl.barcodePattern && (
                        <div className="truncate">
                          <span className="text-slate-400">条码:</span> {tpl.barcodePattern} (组{tpl.barcodeGroup || '-'})
                        </div>
                      )}
                      {tpl.pricePattern && (
                        <div className="truncate">
                          <span className="text-slate-400">价格:</span> {tpl.pricePattern}
                        </div>
                      )}
                      <div className="text-slate-400">
                        行顺序: {tpl.lineOrder || 'name,barcode,price'}
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {deleteConfirmId === tpl.id && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between text-xs text-red-700 animate-in fade-in duration-150">
                        <span>确定要删除此模板吗？</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                          >
                            确认删除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

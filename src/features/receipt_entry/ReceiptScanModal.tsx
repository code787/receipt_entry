import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Check,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ReceiptItem, ReceiptTemplate } from '../../types';
import { storage } from '../../data/storage';
import { ocrService, SAMPLE_RECEIPT_TEXTS } from '../../services/ocrService';
import { TemplateManagementModal } from '../template_management/TemplateManagementModal';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl?: string | null;
  initialItems?: ReceiptItem[];
  initialStoreName?: string;
  initialReceiptNumber?: string;
  initialDate?: string;
  initialRawText?: string;
  onImportSuccess?: () => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  initialItems = [],
  initialStoreName = '',
  initialReceiptNumber = '',
  initialDate = '',
  initialRawText = '',
  onImportSuccess,
}) => {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [note, setNote] = useState('');
  const [rawText, setRawText] = useState('');
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Item edit dialog state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const loadTemplates = () => {
    const list = storage.getAllTemplates();
    setTemplates(list);
    const def = storage.getDefaultTemplate();
    setSelectedTemplate(def);
  };

  useEffect(() => {
    if (isOpen) {
      setItems([...initialItems]);
      setStoreName(initialStoreName || '');
      setReceiptNumber(initialReceiptNumber || '');
      setDate(initialDate || new Date().toISOString().substring(0, 10));
      setNote('');
      setRawText(initialRawText || '');
      setErrorMessage('');
      loadTemplates();
    }
  }, [isOpen, initialItems, initialStoreName, initialReceiptNumber, initialDate, initialRawText]);

  const totalAmount = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

  const handleReparse = () => {
    if (!rawText.trim()) {
      setErrorMessage('暂无可解析的文字内容');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const result = ocrService.parseReceiptText(rawText, selectedTemplate);
      setItems(result.items);
      if (result.storeName && !storeName) {
        setStoreName(result.storeName);
      }
      if (result.receiptNumber && !receiptNumber) {
        setReceiptNumber(result.receiptNumber);
      }
      if (result.date) {
        setDate(result.date);
      }
    } catch (e) {
      setErrorMessage(`解析失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleText = (sample: (typeof SAMPLE_RECEIPT_TEXTS)[0]) => {
    setRawText(sample.text);
    if (sample.sampleStore) setStoreName(sample.sampleStore);
    if (sample.sampleNumber) setReceiptNumber(sample.sampleNumber);
    if (sample.sampleDate) setDate(sample.sampleDate);
    
    // Pick appropriate template
    if (sample.name.includes('得瑞市')) {
      const t = templates.find(tpl => tpl.name.includes('得瑞市')) || selectedTemplate;
      setSelectedTemplate(t || null);
      const res = ocrService.parseReceiptText(sample.text, t);
      setItems(res.items);
      if (res.date) setDate(res.date);
    } else {
      const res = ocrService.parseReceiptText(sample.text, selectedTemplate);
      setItems(res.items);
      if (res.date) setDate(res.date);
    }
  };

  const openAddItem = () => {
    setItemName('');
    setItemBarcode('');
    setItemQty('1');
    setItemPrice('');
    setIsAddingItem(true);
    setEditingItemIndex(null);
  };

  const openEditItem = (index: number) => {
    const item = items[index];
    setItemName(item.productName);
    setItemBarcode(item.barcode || '');
    setItemQty(String(item.quantity));
    setItemPrice(String(item.unitPrice));
    setEditingItemIndex(index);
    setIsAddingItem(false);
  };

  const saveItem = () => {
    const name = itemName.trim();
    const qty = parseFloat(itemQty) || 1;
    const price = parseFloat(itemPrice) || 0.0;

    if (!name || price <= 0) {
      alert('请输入有效的商品名称与单价');
      return;
    }

    const newItem: ReceiptItem = {
      receiptId: 0,
      productName: name,
      barcode: itemBarcode.trim() || undefined,
      quantity: qty,
      unitPrice: price,
      totalPrice: parseFloat((qty * price).toFixed(2)),
    };

    if (isAddingItem) {
      setItems([...items, newItem]);
      setIsAddingItem(false);
    } else if (editingItemIndex !== null) {
      const next = [...items];
      next[editingItemIndex] = newItem;
      setItems(next);
      setEditingItemIndex(null);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    if (items.length === 0) {
      setErrorMessage('请至少添加一个商品');
      return;
    }
    if (!receiptNumber.trim()) {
      setErrorMessage('请输入小票编号（必填）');
      return;
    }

    setIsProcessing(true);
    try {
      storage.insertReceiptWithItems(
        {
          storeName: storeName.trim() || '扫描录入',
          date: date || new Date().toISOString().substring(0, 10),
          note: note.trim() || undefined,
          receiptNumber: receiptNumber.trim(),
          photoPath: photoUrl || undefined,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          theoreticalAmount: parseFloat(totalAmount.toFixed(2)),
          createdAt: new Date().toISOString(),
        },
        items.map(it => ({
          productName: it.productName,
          barcode: it.barcode,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        }))
      );

      onImportSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(`导入失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-200" />
            <h2 className="text-lg font-bold">扫描结果校对</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-teal-800 hover:bg-teal-50 font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              确认导入
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-teal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2 border border-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Photo & Quick Sample Picker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {photoUrl ? (
              <div className="md:col-span-1">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-44 group">
                  <img
                    src={photoUrl}
                    alt="小票照片"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={handleReparse}
                      className="px-3 py-1.5 bg-white/90 text-slate-800 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 hover:bg-white"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      重新识别
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className={photoUrl ? 'md:col-span-2' : 'col-span-3'}>
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-teal-900 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-700" />
                    快速载入样本小票 (测试比对):
                  </span>
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-teal-700 underline text-[11px] hover:text-teal-900"
                  >
                    {showRawText ? '收起 OCR 原文' : '查看/编辑 OCR 原文'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_RECEIPT_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadSampleText(sample)}
                      className="px-2.5 py-1 text-xs font-medium bg-white text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-colors text-left"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible raw text editor */}
              {showRawText && (
                <div className="mt-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-600">OCR 识别文本</label>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="输入或微调 OCR 小票文本..."
                    className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleReparse}
                      className="px-3 py-1 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      按此文本重新解析
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Template Selector Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1 flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 shrink-0">识别模板:</label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const found = templates.find((t) => t.id === id) || null;
                  setSelectedTemplate(found);
                }}
                className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">默认规则解析 (无模板)</option>
                {templates.map((tpl, idx) => (
                  <option key={`scan-tpl-${tpl.id}-${idx}`} value={tpl.id}>
                    {tpl.name} {tpl.isDefault ? '(默认)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={handleReparse}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <RotateCw className="w-3.5 h-3.5" />
                重新解析
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50"
              >
                <Sliders className="w-3.5 h-3.5" />
                管理模板
              </button>
            </div>
          </div>

          {/* Store & Receipt Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">商店名称 (可选)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="例如: 永辉超市万象城店"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                小票编号 <span className="text-red-500">* (必填)</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="必填，如: 20260310001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">备注 (可选)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="添加小票备注说明"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                识别结果 ({items.length}条)
              </h3>
              <button
                type="button"
                onClick={openAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加商品
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
                未识别到商品数据，请选择合适模板重新解析或点击右上角手动添加
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-teal-300 flex items-center justify-between gap-3 shadow-2xs transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm truncate">{item.productName}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {item.barcode && (
                          <span className="font-mono text-slate-400">条码: {item.barcode}</span>
                        )}
                        <span>
                          {item.quantity}件 × ¥{item.unitPrice.toFixed(2)} ={' '}
                          <strong className="text-slate-700 font-semibold">
                            ¥{item.totalPrice.toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditItem(index)}
                        title="编辑"
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        title="删除"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount Summary */}
          <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 flex items-center justify-between">
            <span className="text-sm font-medium text-teal-900">合计金额:</span>
            <span className="text-xl font-bold text-teal-800">¥{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            确认导入
          </button>
        </div>
      </div>

      {/* Edit/Add Item Sub-Dialog */}
      {(isAddingItem || editingItemIndex !== null) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">
              {isAddingItem ? '添加商品' : '编辑商品'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">商品名称</label>
                <input
                  type="text"
                  autoFocus
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="例如: 鲜牛奶"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">条码 (可选)</label>
                <input
                  type="text"
                  value={itemBarcode}
                  onChange={(e) => setItemBarcode(e.target.value)}
                  placeholder="可选条码号"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">数量</label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">单价 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItemIndex(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveItem}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Management Modal */}
      <TemplateManagementModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplatesChanged={loadTemplates}
      />
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Camera,
  Trash2,
  ScanLine,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  Crop,
} from 'lucide-react';
import { ReceiptItem } from '../../types';
import { storage } from '../../data/storage';
import { ocrService, SAMPLE_RECEIPT_TEXTS } from '../../services/ocrService';
import { ReceiptScanModal } from './ReceiptScanModal';
import { ReceiptCropModal } from './ReceiptCropModal';

interface ReceiptEntryScreenProps {
  onEntrySuccess?: () => void;
}

export const ReceiptEntryScreen: React.FC<ReceiptEntryScreenProps> = ({ onEntrySuccess }) => {
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [receiptNumber, setReceiptNumber] = useState('');
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  // Dialog & scanning modal state
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [dialogName, setDialogName] = useState('');
  const [dialogQty, setDialogQty] = useState('1');
  const [dialogPrice, setDialogPrice] = useState('');

  // Crop modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropModalImageSrc, setCropModalImageSrc] = useState('');

  // Scan modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanInitialItems, setScanInitialItems] = useState<ReceiptItem[]>([]);
  const [scanStoreName, setScanStoreName] = useState<string | undefined>('');
  const [scanReceiptNumber, setScanReceiptNumber] = useState<string | undefined>('');
  const [scanDate, setScanDate] = useState<string | undefined>('');
  const [scanRawText, setScanRawText] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const actualTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  const theoreticalTotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const diff = actualTotal - theoreticalTotal;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3500);
  };

  // Add Item to list
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = dialogName.trim();
    const qty = parseFloat(dialogQty) || 1;
    const price = parseFloat(dialogPrice) || 0.0;

    if (!name || price <= 0) {
      alert('请输入有效的商品名称与单价');
      return;
    }

    setItems([
      ...items,
      {
        receiptId: 0,
        productName: name,
        quantity: qty,
        unitPrice: price,
        totalPrice: parseFloat((qty * price).toFixed(2)),
      },
    ]);

    setDialogName('');
    setDialogQty('1');
    setDialogPrice('');
    setIsAddItemDialogOpen(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Photo & OCR handlers
  const handleStartCropForOcr = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropModalImageSrc(dataUrl);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteOcr = async (processedDataUrl: string, rawCroppedUrl: string) => {
    setIsCropModalOpen(false);
    setPhotoUrl(rawCroppedUrl);
    setIsOcrProcessing(true);
    setOcrProgress(5);
    setOcrStatus('正在初始化本地 OCR 引擎 (chi_sim + eng)...');

    try {
      // 100% Local client-side OCR recognition via Tesseract.js (no AI server required)
      const text = await ocrService.recognizeText(processedDataUrl, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatus(status);
      });

      setOcrStatus('正在解析两行式商品条码与金额...');
      const template = storage.getDefaultTemplate();
      const parsed = ocrService.parseReceiptText(text, template);

      if (!parsed || !parsed.items || parsed.items.length === 0) {
        showError('未能在小票中精确识别出商品明细，建议重新框选小票纸张主体并开启黑白增强去噪');
        return;
      }

      setScanInitialItems(parsed.items as ReceiptItem[]);
      setScanStoreName(parsed.storeName || '');
      setScanReceiptNumber(parsed.receiptNumber || `REC-${Date.now().toString().slice(-6)}`);
      setScanDate(parsed.date || new Date().toISOString().substring(0, 10));
      setScanRawText(text);
      setIsScanModalOpen(true);
    } catch (err) {
      showError(`本地 OCR 识别失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsOcrProcessing(false);
      setOcrStatus('');
      setOcrProgress(0);
    }
  };

  const handleScanSample = (sample: (typeof SAMPLE_RECEIPT_TEXTS)[0]) => {
    const template = storage.getDefaultTemplate();
    const parsed = ocrService.parseReceiptText(sample.text, template);

    setScanInitialItems(parsed.items as ReceiptItem[]);
    setScanStoreName(sample.sampleStore || parsed.storeName || '');
    setScanReceiptNumber(sample.sampleNumber || parsed.receiptNumber || `REC-${Date.now().toString().slice(-6)}`);
    setScanDate(sample.sampleDate || parsed.date || new Date().toISOString().substring(0, 10));
    setScanRawText(sample.text);
    setIsScanModalOpen(true);
  };

  // Submit Receipt
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      showError('请输入商店名称');
      return;
    }
    if (items.length === 0) {
      showError('请至少录入一个商品');
      return;
    }

    try {
      storage.insertReceiptWithItems(
        {
          storeName: storeName.trim(),
          date,
          note: note.trim() || undefined,
          receiptNumber: receiptNumber.trim() || undefined,
          photoPath: photoUrl || undefined,
          totalAmount: parseFloat(actualTotal.toFixed(2)),
          theoreticalAmount: parseFloat(theoreticalTotal.toFixed(2)),
          createdAt: new Date().toISOString(),
        },
        items.map((it) => ({
          productName: it.productName,
          barcode: it.barcode,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        }))
      );

      showToast('小票录入成功！');
      // Reset form
      setStoreName('');
      setNote('');
      setReceiptNumber('');
      setPhotoUrl(null);
      setItems([]);
      setDate(new Date().toISOString().substring(0, 10));

      onEntrySuccess?.();
    } catch (err) {
      showError(`录入失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-6 pt-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-teal-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertCircle className="w-5 h-5 text-red-300" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* OCR processing loading indicator */}
      {isOcrProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 max-w-xs w-full text-center">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-800 text-sm">{ocrStatus || '正在识别小票内容...'}</p>
            <p className="text-xs text-slate-500">请稍候，正在解析商品名、条码与金额</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main form fields */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              商店名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="请输入商店名称 (如: 永辉超市万象城店)"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">小票编号 (可选)</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="可选小票编号"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">备注</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注信息"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        </div>

        {/* Photo Section */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">小票照片</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                title="拍照"
                className="p-2 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="上传图片"
                className="p-2 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  title="删除照片"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleStartCropForOcr(e.target.files[0]);
              }
            }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleStartCropForOcr(e.target.files[0]);
              }
            }}
          />

          {photoUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900 flex flex-col items-center justify-center group">
              <img src={photoUrl} alt="小票预览" className="max-h-56 object-contain" />
              <button
                type="button"
                onClick={() => {
                  setCropModalImageSrc(photoUrl);
                  setIsCropModalOpen(true);
                }}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-xs transition-colors"
              >
                <Crop className="w-3.5 h-3.5" />
                重新裁切/增强
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-400 bg-slate-50/70 hover:bg-teal-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-slate-400 hover:text-teal-600"
            >
              <Camera className="w-8 h-8" />
              <span className="text-xs font-medium">点击拍照或上传小票照片</span>
            </div>
          )}
        </div>

        {/* OCR Scan Button & Quick Sample Tests */}
        <div className="space-y-2.5">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files?.[0]) {
                    handleStartCropForOcr(target.files[0]);
                  }
                };
                input.click();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.99]"
            >
              <ScanLine className="w-5 h-5 text-teal-100" />
              <span>拍照 / 上传小票进行 OCR 识别 (本地引擎)</span>
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
              <span className="flex items-center gap-1 text-teal-700 font-medium">
                <Crop className="w-3.5 h-3.5" />
                自动纸张贴合裁切
              </span>
              <span>·</span>
              <span>杜绝藤编/阴影杂质</span>
              <span>·</span>
              <span className="text-slate-600">纯本地无需 AI</span>
            </div>
          </div>

          {/* Quick test with sample receipts */}
          <div className="p-3 bg-slate-100/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 border border-slate-200/70">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <FileText className="w-4 h-4 text-teal-600 shrink-0" />
              快速填入真实样本测试:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_RECEIPT_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleScanSample(sample)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                    idx === 0
                      ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold hover:bg-teal-100'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {idx === 0 ? '✨ 参考样本(19件)' : sample.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              商品列表 ({items.length}件)
            </h3>
            <button
              type="button"
              onClick={() => setIsAddItemDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加商品
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              暂未添加商品，请点击右上角「添加商品」或使用「扫描识别小票」
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 group hover:border-teal-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm truncate">{item.productName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.quantity}件 × ¥{item.unitPrice.toFixed(2)} ={' '}
                      <span className="font-semibold text-slate-700">¥{item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title="移除商品"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calculation Summary Card */}
        <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 space-y-1.5 text-sm">
          <div className="flex justify-between items-center text-slate-700">
            <span>实际金额:</span>
            <span className="font-bold text-slate-900">¥{actualTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>理论金额:</span>
            <span className="font-bold text-slate-900">¥{theoreticalTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-teal-200/60 font-bold">
            <span>差额:</span>
            <span className={Math.abs(diff) > 0.01 ? 'text-red-600' : 'text-emerald-700'}>
              ¥{diff.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>提交小票</span>
        </button>
      </form>

      {/* Add Item Dialog */}
      {isAddItemDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">添加商品</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">商品名称</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={dialogName}
                  onChange={(e) => setDialogName(e.target.value)}
                  placeholder="请输入商品名称"
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
                    required
                    value={dialogQty}
                    onChange={(e) => setDialogQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">单价 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={dialogPrice}
                    onChange={(e) => setDialogPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemDialogOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Cropping & Enhancement Modal (Cuts out wicker background) */}
      <ReceiptCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropModalImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onConfirmCrop={handleExecuteOcr}
      />

      {/* OCR Processing Progress Overlay */}
      {isOcrProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-teal-100 animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-teal-500 flex items-center justify-center text-teal-600">
                <ScanLine className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-base">本地 OCR 扫描中</h4>
              <p className="text-xs text-slate-500 mt-0.5">纯本地离线运行 · 无需 AI · 保护数据隐私</p>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="truncate pr-2">{ocrStatus || '正在分析小票文字...'}</span>
                <span className="text-teal-600 shrink-0 font-mono">{ocrProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(6, ocrProgress)}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100 text-center">
              已自动切除藤编背景并完成热敏纸黑白二值化增强
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOcrProcessing(false);
                setOcrStatus('');
                setOcrProgress(0);
              }}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消识别
            </button>
          </div>
        </div>
      )}

      {/* OCR Scan Review Modal */}
      <ReceiptScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        photoUrl={photoUrl}
        initialItems={scanInitialItems}
        initialStoreName={scanStoreName}
        initialReceiptNumber={scanReceiptNumber}
        initialDate={scanDate}
        initialRawText={scanRawText}
        onImportSuccess={() => {
          showToast('扫描结果已成功导入！');
          onEntrySuccess?.();
        }}
      />
    </div>
  );
};

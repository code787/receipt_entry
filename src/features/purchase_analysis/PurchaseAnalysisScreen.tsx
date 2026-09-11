import React, { useState, useEffect } from 'react';
import {
  Receipt,
  ReceiptSummaryItem,
  ReceiptItem,
} from '../../types';
import { storage } from '../../data/storage';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';

export const PurchaseAnalysisScreen: React.FC = () => {
  const [summaries, setSummaries] = useState<ReceiptSummaryItem[]>([]);
  const [expandedReceiptId, setExpandedReceiptId] = useState<number | null>(null);
  const [deleteConfirmReceipt, setDeleteConfirmReceipt] = useState<ReceiptSummaryItem | null>(null);

  const loadData = () => {
    const list = storage.getReceiptSummary();
    setSummaries(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalReceipts = summaries.length;
  const actualTotal = summaries.reduce((sum, r) => sum + r.actualTotal, 0);
  const theoreticalTotal = summaries.reduce((sum, r) => sum + r.theoreticalTotal, 0);
  const totalDiff = actualTotal - theoreticalTotal;

  const toggleExpand = (id: number) => {
    setExpandedReceiptId(expandedReceiptId === id ? null : id);
  };

  const handleDelete = (r: ReceiptSummaryItem) => {
    if (r.receiptNumber) {
      storage.deleteReceiptByNumber(r.receiptNumber);
    } else {
      storage.deleteReceipt(r.id);
    }
    setDeleteConfirmReceipt(null);
    loadData();
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 sm:px-6 pt-4 space-y-5">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">小票数量</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{totalReceipts}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">实际总金额</div>
          <div className="text-2xl font-bold text-teal-700 mt-1">¥{actualTotal.toFixed(2)}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">理论总金额</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">¥{theoreticalTotal.toFixed(2)}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">总差额</div>
          <div
            className={`text-2xl font-bold mt-1 ${
              Math.abs(totalDiff) > 0.01 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            ¥{totalDiff.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Receipts Breakdown Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-teal-700" />
            小票明细 ({summaries.length}张)
          </h3>
        </div>

        {summaries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            暂无已录入的小票数据
          </div>
        ) : (
          <div className="space-y-3">
            {summaries.map((receipt) => {
              const isExpanded = expandedReceiptId === receipt.id;
              const diff = receipt.actualTotal - receipt.theoreticalTotal;

              return (
                <div
                  key={receipt.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Accordion header */}
                  <div
                    onClick={() => toggleExpand(receipt.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {receipt.storeName}
                        </span>
                        {receipt.receiptNumber && (
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded">
                            {receipt.receiptNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {receipt.date}
                        </span>
                        <span>{receipt.itemCount}件商品</span>
                        <span>
                          实际: <strong className="text-slate-800 font-semibold">¥{receipt.actualTotal.toFixed(2)}</strong>
                        </span>
                        <span>
                          理论: ¥{receipt.theoreticalTotal.toFixed(2)}
                        </span>
                        <span
                          className={`font-semibold ${
                            Math.abs(diff) > 0.01 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          差额: ¥{diff.toFixed(2)}
                        </span>
                      </div>

                      {receipt.note && (
                        <div className="text-xs text-slate-400 mt-1 italic">
                          备注: {receipt.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmReceipt(receipt);
                        }}
                        title="删除此小票"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Accordion expanded content: Items breakdown */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                      <div className="text-xs font-bold text-slate-600 mb-2">商品清单明细</div>
                      {receipt.items && receipt.items.length > 0 ? (
                        <div className="space-y-1.5">
                          {receipt.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="font-semibold text-slate-800 truncate">
                                  {item.productName}
                                </div>
                                {item.barcode && (
                                  <div className="text-[11px] font-mono text-slate-400">
                                    条码: {item.barcode}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-slate-500 mr-2">
                                  {item.quantity}件 × ¥{item.unitPrice.toFixed(2)}
                                </span>
                                <span className="font-bold text-slate-900">
                                  ¥{item.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 py-2">暂无明细商品</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">删除确认</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              确定要删除小票{' '}
              <span className="font-semibold text-slate-800">
                {deleteConfirmReceipt.receiptNumber || deleteConfirmReceipt.storeName}
              </span>{' '}
              吗？此操作将同时移除该小票下的所有商品记录。
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmReceipt(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmReceipt)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

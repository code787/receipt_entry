import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, TrendingDown, TrendingUp, BarChart2, Tag } from 'lucide-react';
import { ProductPrice, PriceComparisonItem } from '../../types';
import { storage } from '../../data/storage';

export const PriceQueryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'comparison'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [comparisonData, setComparisonData] = useState<PriceComparisonItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const loadData = () => {
    setPrices(storage.getAllProductPrices());
    setComparisonData(storage.getPriceComparisonData());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPrices = searchTerm
    ? prices.filter((p) => p.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    : prices;

  const filteredComparison = searchTerm
    ? comparisonData.filter((c) => c.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    : comparisonData;

  // Selected product history
  const selectedHistory = selectedProduct
    ? prices.filter((p) => p.productName === selectedProduct)
    : [];

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 sm:px-6 pt-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索商品名称..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
          >
            清空
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          onClick={() => {
            setActiveTab('records');
            setSelectedProduct(null);
          }}
          className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'records'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          价格记录 ({filteredPrices.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('comparison');
            setSelectedProduct(null);
          }}
          className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'comparison'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          比价分析 ({filteredComparison.length})
        </button>
      </div>

      {/* Tab 1: Price Records */}
      {activeTab === 'records' && (
        <div className="space-y-2.5">
          {filteredPrices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              暂无价格记录
            </div>
          ) : (
            filteredPrices.map((price, idx) => (
              <div
                key={`price-${price.id}-${idx}`}
                onClick={() => setSelectedProduct(price.productName)}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-400 shadow-2xs transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{price.productName}</h4>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    <span className="text-teal-700 font-bold text-sm">¥{price.price.toFixed(2)}</span>
                    <span className="text-slate-300">|</span>
                    <span>{price.lastUpdated}</span>
                    {price.storeName && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="truncate max-w-[180px]">{price.storeName}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Price Comparison Analysis */}
      {activeTab === 'comparison' && (
        <div className="space-y-3">
          {filteredComparison.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              暂无比价数据
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">商品</th>
                      <th className="py-3 px-3">最低价</th>
                      <th className="py-3 px-3">最高价</th>
                      <th className="py-3 px-3">平均价</th>
                      <th className="py-3 px-3 text-center">记录数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredComparison.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedProduct(item.productName)}
                        className="hover:bg-teal-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900 truncate max-w-[160px]">
                          {item.productName}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-emerald-600 whitespace-nowrap">
                          ¥{item.minPrice.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-red-500 whitespace-nowrap">
                          ¥{item.maxPrice.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          ¥{item.avgPrice.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-500 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            {item.recordCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Product History Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs text-teal-600 font-bold uppercase tracking-wider">价格历史</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedProduct}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedHistory.map((h, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-teal-700 text-sm">¥{h.price.toFixed(2)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {h.storeName || '未指定商店'}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{h.lastUpdated}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

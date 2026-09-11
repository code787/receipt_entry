import React, { useState } from 'react';
import {
  FileText,
  Search,
  BarChart3,
  Sliders,
  Receipt as ReceiptIcon,
  RotateCcw,
} from 'lucide-react';
import { ReceiptEntryScreen } from './features/receipt_entry/ReceiptEntryScreen';
import { PriceQueryScreen } from './features/price_query/PriceQueryScreen';
import { PurchaseAnalysisScreen } from './features/purchase_analysis/PurchaseAnalysisScreen';
import { TemplateManagementModal } from './features/template_management/TemplateManagementModal';
import { storage } from './data/storage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'entry' | 'query' | 'analysis'>('entry');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleResetData = () => {
    if (window.confirm('确定要重置为默认数据吗？这将恢复初始演示小票与模板配置。')) {
      storage.resetToDefaults();
      triggerRefresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-teal-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-teal-800 rounded-lg">
              <ReceiptIcon className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-tight">小票录入系统</h1>
              <span className="text-[10px] text-teal-200 hidden sm:inline">
                支持 OCR 智能扫描、模板定制与比价分析
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-800 text-teal-100 hover:text-white text-xs font-semibold transition-colors shadow-2xs"
              title="管理小票识别模板"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>模板管理</span>
            </button>
            <button
              onClick={handleResetData}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 transition-colors"
              title="重置测试数据"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Body */}
      <main className="flex-1">
        {currentTab === 'entry' && <ReceiptEntryScreen key={`entry-${refreshKey}`} onEntrySuccess={triggerRefresh} />}
        {currentTab === 'query' && <PriceQueryScreen key={`query-${refreshKey}`} />}
        {currentTab === 'analysis' && <PurchaseAnalysisScreen key={`analysis-${refreshKey}`} />}
      </main>

      {/* Template Management Modal */}
      <TemplateManagementModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onTemplatesChanged={triggerRefresh}
      />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-md mx-auto h-16 flex items-center justify-around px-2">
          <button
            onClick={() => setCurrentTab('entry')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'entry'
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <FileText className={`w-5 h-5 ${currentTab === 'entry' ? 'text-teal-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-1">小票录入</span>
          </button>

          <button
            onClick={() => setCurrentTab('query')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'query'
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Search className={`w-5 h-5 ${currentTab === 'query' ? 'text-teal-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-1">价格查询</span>
          </button>

          <button
            onClick={() => setCurrentTab('analysis')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'analysis'
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${currentTab === 'analysis' ? 'text-teal-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-1">金额分析</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

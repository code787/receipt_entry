import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous payload limit for receipt images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API: AI-Powered Smart Receipt OCR
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const ai = getGeminiClient();

    const prompt = `你是一个专业的超市/商场小票智能识别系统。
请仔细识别这张小票图片中的所有真实信息，并输出结构化 JSON 数据。

重点注意规避虚假识别和背景干扰：
1. 背景中可能有藤编椅子、木纹、杂物条纹或折痕，请严格过滤背景噪点，切勿将背景纹理误识别为字符！
2. 常见超市/生鲜小票通常采用“两行式”或“单行式”结构：
   - 第一行通常为商品名称及规格单位（例如“大白菜 kg(1*1)”、“鱿鱼头 (冰) kg(1*1)”、“面子安米血300g 袋(1*1)”、"云蕾19451盒装烹调纸(8米) 盒(1"）。
   - 第二行通常为商品条码（13-14位数字） + 数量 + 单价 + 金额（例如“21060220078002 2.18 3.18 6.93”）。
   - 切勿将条码数字当做商品名称！必须将第一行的品名与第二行的条码、数量、单价、总价正确对应！
3. 请完整提取所有商品，不要遗漏任何一项商品。
4. 提取小票抬头或底部的关键元数据：
   - storeName: 店名（如永辉超市、得瑞市、大悦城店等，若小票未明确注明可根据公章或特征提取）
   - receiptNumber: 小票流水号/单号/交易号（如果小票有）
   - date: 交易日期，格式为 YYYY-MM-DD（例如 "2026-09-06"）
   - totalAmount: 应付总金额（例如 255.71）
   - totalQuantity: 购买总数量或总重量（例如 13.742）
   - itemCount: 总件数（例如 19）
   - rawText: 完整的小票文本识别稿（逐行整理好便于用户核对）
   - items: 商品列表，每个商品包含：
     - productName: 商品名称（去除纯条码干扰，保留规格如“大白菜 kg(1*1)”）
     - barcode: 商品条码/货号（如 "21060220078002"，如有）
     - quantity: 数量或重量（浮点数，如 2.18、0.718 或 1）
     - unitPrice: 单价（浮点数，如 3.18、5.17）
     - totalPrice: 金额（浮点数，如 6.93、3.71）

请直接以 JSON 格式返回，确保数字类型正确。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING },
            receiptNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            totalQuantity: { type: Type.NUMBER },
            itemCount: { type: Type.INTEGER },
            rawText: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  barcode: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                },
                required: ['productName', 'quantity', 'unitPrice', 'totalPrice'],
              },
            },
          },
          required: ['items', 'totalAmount'],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsedData = JSON.parse(outputText);
    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Scan receipt error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to scan receipt with AI',
    });
  }
});

async function startServer() {
  // Vite middleware for development or static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import { createWorker } from 'tesseract.js';
import { ReceiptItem, ReceiptTemplate } from '../types';

export interface CropRect {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  width: number; // 0.0 to 1.0
  height: number; // 0.0 to 1.0
}

export interface ParseResult {
  storeName?: string;
  receiptNumber?: string;
  date?: string;
  totalAmount?: number;
  totalQuantity?: number;
  itemCount?: number;
  items: Omit<ReceiptItem, 'id' | 'receiptId'>[];
  rawText: string;
}

export interface SampleReceiptText {
  name: string;
  sampleStore?: string;
  sampleNumber?: string;
  sampleDate?: string;
  text: string;
}

export const SAMPLE_RECEIPT_TEXTS: SampleReceiptText[] = [
  {
    name: '生鲜超市两行式小票（参考样本真实数据，19件商品）',
    sampleStore: '生鲜超市厦门大悦城店',
    sampleNumber: '20260906090953',
    sampleDate: '2026-09-06',
    text: `交易时间:  2026-09-06 09:09:53
==========销======售==========
货号/品名   数量   单价  金额
大白菜 kg(1*1)
21060220078002 2.18 3.18    6.93
茄子 kg(1*1)
21060540037100 0.718 5.17   3.71
沙地白萝卜 kg(1*1)
21065200026000 0.728 3.57   2.60
鱿鱼头 (冰) kg(1*1)
21070680271400 0.454 59.78 27.14
半番鸭 kg(1*1)
21051370308401 1.296 23.80 30.84
牛上肉 kg(1*1)
21059380402100 0.458 87.80 40.21
牛小排 kg(1*1)
21051180622900 0.726 85.80 62.29
西兰花 kg(1*1)
21060340035700 0.448 7.17   3.21
西红柿粉果 kg(1*1)
21062580056000 0.78 7.18    5.60
空心菜[把] 把(1*1)
21061550039000 1    3.90    3.90
炒熟黑芝麻 kg(1*1)
21023360085900 0.216 39.77  8.59
上海青 kg(1*1)
21060100039200 0.518 7.16   3.71
白玉山药 kg(1*1)
21063770087000 0.872 7.97   6.95
面子安米血300g 袋(1*1)
6977471291005 1    3.90    3.90
冰带鱼 (冰) kg(1*1)
21070110270500 0.566 47.80 27.05
毛毛菜 kg(1*1)
21060520032400 0.452 7.17   3.24
红蒜 kg(1*1)
21068910025200 0.158 13.92  2.20
云蕾19451盒装烹调纸(8米) 盒(1
6956934819451 1   10.90   10.90
蒜苔 (白帽) kg(1*1)
21060380027400 0.172 15.93  2.74
==============================
合计:
数量: 13.742  件数:   19
购物篮合计应付: 255.71元`,
  },
  {
    name: '得瑞市小票样例',
    sampleStore: '得瑞市厦门大悦城店',
    sampleNumber: '20260309100234',
    sampleDate: '2026-03-09',
    text: `得瑞市厦门大悦城店
单号: 20260309100234
------------------------------
鲜牛奶950ml6901234567890
1 15.80 15.80
可口可乐330ml*6听6900012345671
1 18.00 18.00
全麦吐司面包250g6923456789012
1 10.00 10.00
------------------------------
合计数量: 4
合计金额: 46.70
谢谢惠顾，欢迎下次光临！`,
  },
  {
    name: '超市散称/生鲜样例',
    sampleStore: '永辉超市万象城店',
    sampleNumber: '20260308008812',
    sampleDate: '2026-03-08',
    text: `永辉超市万象城店
流水号: 20260308008812
------------------------------
红富士苹果/kg
2100054321098
2 15.00 30.00
可口可乐330ml*6听
6900012345671
1 18.00 18.00
天然苏打水500ml
6933344556677
2 3.00 6.00
------------------------------
总计: 54.00
谢谢惠顾`,
  },
  {
    name: '传统单行小票样例',
    sampleStore: '好邻居便利店',
    sampleNumber: '2026030988771',
    sampleDate: '2026-03-09',
    text: `好邻居便利店
单号: 2026030988771
------------------------------
冰红茶500ml 2 3.50 7.00
奥利奥原味饼干 1 7.50 7.50
农夫山泉550ml 3 2.00 6.00
------------------------------
合计: 20.50`,
  },
];

export class OCRService {
  /**
   * Automatically detect receipt paper bounding box on client canvas.
   * White/light thermal paper has high luminance compared to wicker chairs or dark tables.
   */
  detectReceiptBounds(img: HTMLImageElement): CropRect {
    try {
      const sw = 240;
      const nw = img.naturalWidth || img.width || 800;
      const nh = img.naturalHeight || img.height || 1200;
      const sh = Math.max(160, Math.round((nh / nw) * sw));

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { x: 0.1, y: 0.05, width: 0.8, height: 0.9 };

      ctx.drawImage(img, 0, 0, sw, sh);
      const imgData = ctx.getImageData(0, 0, sw, sh);
      const data = imgData.data;

      const colPaper = new Int32Array(sw);
      const rowPaper = new Int32Array(sh);
      let totalPaper = 0;

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = (y * sw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);

          // Paper detection: light tone (lum > 150) and low color saturation
          if (lum > 145 && maxC - minC < 55) {
            colPaper[x]++;
            rowPaper[y]++;
            totalPaper++;
          }
        }
      }

      // If at least 10% of image contains paper pixels
      if (totalPaper > sw * sh * 0.08) {
        const colThresh = sh * 0.22;
        let minX = 0;
        while (minX < sw && colPaper[minX] < colThresh) minX++;
        let maxX = sw - 1;
        while (maxX > minX && colPaper[maxX] < colThresh) maxX--;

        const rowThresh = Math.max(8, (maxX - minX) * 0.2);
        let minY = 0;
        while (minY < sh && rowPaper[minY] < rowThresh) minY++;
        let maxY = sh - 1;
        while (maxY > minY && rowPaper[maxY] < rowThresh) maxY--;

        // Margins to prevent cutting text
        const marginX = Math.round(sw * 0.02);
        const marginY = Math.round(sh * 0.02);
        minX = Math.max(0, minX - marginX);
        maxX = Math.min(sw - 1, maxX + marginX);
        minY = Math.max(0, minY - marginY);
        maxY = Math.min(sh - 1, maxY + marginY);

        const w = (maxX - minX) / sw;
        const h = (maxY - minY) / sh;

        if (w >= 0.18 && h >= 0.2) {
          return {
            x: Math.max(0, minX / sw),
            y: Math.max(0, minY / sh),
            width: Math.min(1, w),
            height: Math.min(1, h),
          };
        }
      }
    } catch (e) {
      console.warn('Auto receipt detect failed, using default bounds:', e);
    }
    return { x: 0.12, y: 0.04, width: 0.76, height: 0.92 };
  }

  /**
   * Crop and apply CamScanner-grade local adaptive binarization to image.
   * Completely washes out wicker chair background, shadows, and wrinkles,
   * leaving crisp solid black thermal text on pure white background.
   */
  async cropAndPreprocess(
    img: HTMLImageElement,
    crop: CropRect,
    rotation: number = 0,
    enhance: boolean = true
  ): Promise<{ processedDataUrl: string; rawCroppedUrl: string; previewDataUrl: string }> {
    return new Promise((resolve, reject) => {
      try {
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;

        // 1. Draw rotated full image onto temporary canvas
        const rotCanvas = document.createElement('canvas');
        const is90or270 = rotation % 180 !== 0;
        rotCanvas.width = is90or270 ? nh : nw;
        rotCanvas.height = is90or270 ? nw : nh;
        const rotCtx = rotCanvas.getContext('2d');
        if (!rotCtx) throw new Error('Canvas 2D context unavailable');

        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate((rotation * Math.PI) / 180);
        rotCtx.drawImage(img, -nw / 2, -nh / 2);

        // 2. Crop to selected area
        const cropX = Math.max(0, Math.round(crop.x * rotCanvas.width));
        const cropY = Math.max(0, Math.round(crop.y * rotCanvas.height));
        const cropW = Math.max(20, Math.min(rotCanvas.width - cropX, Math.round(crop.width * rotCanvas.width)));
        const cropH = Math.max(20, Math.min(rotCanvas.height - cropY, Math.round(crop.height * rotCanvas.height)));

        // Limit maximum dimension for optimal OCR performance without lagging mobile devices
        const maxDim = 1900;
        let targetW = cropW;
        let targetH = cropH;
        if (targetW > maxDim || targetH > maxDim) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * maxDim) / targetW);
            targetW = maxDim;
          } else {
            targetW = Math.round((targetW * maxDim) / targetH);
            targetH = maxDim;
          }
        }

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = targetW;
        cropCanvas.height = targetH;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) throw new Error('Crop canvas context error');

        // Draw cropped region
        cropCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
        const rawCroppedUrl = cropCanvas.toDataURL('image/jpeg', 0.9);

        if (!enhance) {
          resolve({
            processedDataUrl: rawCroppedUrl,
            rawCroppedUrl,
            previewDataUrl: rawCroppedUrl,
          });
          return;
        }

        // 3. CamScanner-grade Bradley-Roth Local Adaptive Binarization
        const imgData = cropCtx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // Grayscale conversion
        const gray = new Uint8Array(targetW * targetH);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          gray[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }

        // Fast Integral Image (O(N) time)
        const stride = targetW + 1;
        const integral = new Uint32Array(stride * (targetH + 1));
        for (let y = 0; y < targetH; y++) {
          let rowSum = 0;
          for (let x = 0; x < targetW; x++) {
            rowSum += gray[y * targetW + x];
            integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum;
          }
        }

        // Local window size (adapts to receipt line height)
        const s = Math.max(16, Math.min(48, Math.round(targetW / 24)));
        const s2 = Math.floor(s / 2);
        const t = 0.11; // 11% darker than local background is text stroke

        for (let y = 0; y < targetH; y++) {
          const y1 = Math.max(0, y - s2);
          const y2 = Math.min(targetH - 1, y + s2);
          for (let x = 0; x < targetW; x++) {
            const x1 = Math.max(0, x - s2);
            const x2 = Math.min(targetW - 1, x + s2);
            const count = (x2 - x1 + 1) * (y2 - y1 + 1);

            const sum =
              integral[(y2 + 1) * stride + (x2 + 1)] -
              integral[y1 * stride + (x2 + 1)] -
              integral[(y2 + 1) * stride + x1] +
              integral[y1 * stride + x1];

            const currentVal = gray[y * targetW + x];
            // If darker than local mean * (1 - t), it's black text; else pure white paper
            const isText = currentVal * count < sum * (1.0 - t);
            const val = isText ? 0 : 255;

            const idx = (y * targetW + x) * 4;
            data[idx] = val;
            data[idx + 1] = val;
            data[idx + 2] = val;
            data[idx + 3] = 255;
          }
        }

        cropCtx.putImageData(imgData, 0, 0);
        const processedDataUrl = cropCanvas.toDataURL('image/png');

        resolve({
          processedDataUrl,
          rawCroppedUrl,
          previewDataUrl: processedDataUrl,
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Run local client-side OCR using tesseract.js with chi_sim + eng.
   * Completely independent of server AI, works directly in mobile browsers.
   */
  async recognizeText(
    imageSource: string | File | Blob,
    onProgress?: (progress: number, status: string) => void
  ): Promise<string> {
    onProgress?.(10, '正在初始化本地 OCR 引擎 (chi_sim + eng)...');

    // Convert file/blob to object url or base64 if needed
    let src = imageSource;
    if (imageSource instanceof Blob) {
      src = URL.createObjectURL(imageSource);
    }

    try {
      const worker = await createWorker('chi_sim+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.min(96, 20 + Math.round((m.progress || 0) * 75));
            onProgress?.(pct, `正在逐行识别小票文字 (${pct}%)...`);
          } else if (m.status) {
            onProgress?.(15, `准备识别字库 (${m.status})...`);
          }
        },
      });

      try {
        const ret = await worker.recognize(src);
        onProgress?.(98, '正在清洗 OCR 文本与去除杂色字符...');
        return ret.data.text;
      } finally {
        await worker.terminate();
      }
    } finally {
      if (typeof src === 'string' && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    }
  }

  /**
   * Clean raw OCR output from Tesseract to eliminate rattan pattern artifacts,
   * fix disconnected barcode digits, normalize decimal points, and remove junk.
   */
  cleanReceiptOcrText(rawText: string): string {
    const lines = rawText.split(/\r?\n/);
    const cleaned: string[] = [];

    for (const rawLine of lines) {
      let l = rawLine.trim();
      if (!l) continue;

      // 1. Full-width to half-width conversion
      l = l.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
      l = l.replace(/\u3000/g, ' ');

      // 2. Discard lines that contain ONLY non-alphanumeric noise (rattan weave artifacts like "|| // \\ ^^ ~~~")
      if (!/[\u4e00-\u9fa5a-zA-Z0-9]/.test(l)) {
        continue;
      }

      // 3. Fix disconnected barcodes with single spaces between individual digits (e.g. "2 1 0 6 0 2 2 0 0 7 8 0 0 2")
      // Only collapse spaces if there is a run of 6+ single spaced digits:
      l = l.replace(/\b(\d\s+){5,}\d\b/g, (match) => match.replace(/\s+/g, ''));

      // 4. Fix decimal numbers with spaces or commas: "2 . 18" -> "2.18", "0 , 718" -> "0.718"
      l = l.replace(/(\d+)\s*[\.,]\s*(\d{1,4})/g, '$1.$2');

      // 5. Fix common OCR character confusion in barcode/digit runs:
      // e.g. "2l0602" -> "210602", "o078" -> "0078"
      l = l.replace(/(?<=\d)[lI|](?=\d)/g, '1');
      l = l.replace(/(?<=\d)[oO](?=\d)/g, '0');

      cleaned.push(l);
    }

    return cleaned.join('\n');
  }

  /**
   * Parse extracted OCR text lines based on ReceiptTemplate rules and intelligent heuristics.
   * Deeply optimized for real Chinese supermarket receipts (2-line layout, barcodes, weights/decimals).
   */
  parseReceiptText(rawText: string, template?: ReceiptTemplate | null): ParseResult {
    const cleanedText = this.cleanReceiptOcrText(rawText);
    const rawLines = cleanedText.split(/\r?\n/);

    // Clean noise, trim, ignore pure punctuation / decorative borders
    const lines = rawLines
      .map((l) => l.trim())
      .filter((l) => {
        if (l.length === 0) return false;
        if (/^[\=\-\—\_\~\*\#\|\s\:\.\/]+$/.test(l)) return false;
        return true;
      });

    const items: Omit<ReceiptItem, 'id' | 'receiptId'>[] = [];
    let detectedStoreName: string | undefined = template?.storeName || undefined;
    let detectedReceiptNumber: string | undefined;
    let detectedDate: string | undefined;
    let detectedTotalAmount: number | undefined;
    let detectedTotalQuantity: number | undefined;
    let detectedItemCount: number | undefined;

    // Scan for receipt header and footer metadata
    for (const line of lines) {
      // 1. Store Name
      if (!detectedStoreName) {
        const storeMatch = line.match(/(.+?(?:超市|便利店|百货|大悦城|万象城|生鲜|商场|专卖店|店))/);
        if (
          storeMatch &&
          storeMatch[1].length >= 3 &&
          !storeMatch[1].includes('欢迎') &&
          !storeMatch[1].includes('谢谢') &&
          !storeMatch[1].includes('时间')
        ) {
          detectedStoreName = storeMatch[1].trim();
        }
      }

      // 2. Receipt Number / Flow ID
      if (!detectedReceiptNumber) {
        const noMatch = line.match(/(?:单号|小票号|流水号|交易号|POS单号)[:：\s]*([A-Za-z0-9-]{6,30})/);
        if (noMatch) {
          detectedReceiptNumber = noMatch[1].trim();
        }
      }

      // 3. Date / Time
      if (!detectedDate) {
        const dateMatch = line.match(/(?:交易时间|时间|日期)?[:：\s]*(\d{4}[-/.]\d{2}[-/.]\d{2})/);
        if (dateMatch) {
          detectedDate = dateMatch[1].replace(/\//g, '-').replace(/\./g, '-');
        }
      }

      // 4. Total Amount
      if (detectedTotalAmount === undefined) {
        const totalMatch = line.match(
          /(?:购物篮合计应付|应付合计|合计应付|应付金额|合计金额|总计|合计)[:：\s]*([0-9.]+)\s*元?/
        );
        if (totalMatch) {
          const val = parseFloat(totalMatch[1]);
          if (!isNaN(val) && val > 0) {
            detectedTotalAmount = val;
          }
        }
      }

      // 5. Item Count & Total Quantity
      const countMatch = line.match(/件数[:：\s]*(\d+)/);
      if (countMatch) {
        detectedItemCount = parseInt(countMatch[1], 10);
      }
      const qtyMatch = line.match(/数量[:：\s]*([0-9.]+)/);
      if (qtyMatch) {
        detectedTotalQuantity = parseFloat(qtyMatch[1]);
      }
    }

    // Helper: is this line a header or footer noise line?
    const isSkipLine = (l: string): boolean => {
      if (template?.skipPattern) {
        try {
          if (new RegExp(template.skipPattern).test(l)) return true;
        } catch {}
      }
      return /^(?:货号[\/、]品名|品名[\/、]条码|数量\s+单价\s+金额|==========|----------|欢迎光临|谢谢惠顾|工号|机号|找零|现金|刷卡|微信支付|支付宝|购物篮合计应付|实收|找零|会员号|积分|合计[:：]|交易时间)/.test(
        l
      );
    };

    // --- STRATEGY 1: Two-Line Chinese Supermarket Pattern ---
    // Line i: Product Name & spec (e.g. "大白菜 kg(1*1)", "鱿鱼头 (冰) kg(1*1)")
    // Line i+1: Barcode (8-18 digits) + Quantity + UnitPrice + TotalPrice
    // e.g. "21060220078002 2.18 3.18 6.93"
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (isSkipLine(line)) {
        i++;
        continue;
      }

      // Look ahead for barcode & numbers line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const tokens = nextLine.replace(/,/g, '.').split(/\s+/).filter(Boolean);

        // Subcase A: Barcode (7-18 digits) + Quantity + UnitPrice + TotalPrice
        if (tokens.length >= 3) {
          const first = tokens[0].replace(/[^\d]/g, '');
          if (first.length >= 7 && first.length <= 18) {
            const nums = tokens
              .slice(1)
              .map((t) => parseFloat(t.replace(/[^\d\.]/g, '')))
              .filter((n) => !isNaN(n));

            if (nums.length >= 2) {
              const qty = nums[0];
              const unitPrice = nums.length >= 3 ? nums[1] : 0;
              const totalPrice = nums.length >= 3 ? nums[2] : nums[1];

              let cleanName = line
                .replace(/^[\d\.\s]+/, '') // Remove stray leading numbers
                .replace(/^[-\—\=\:\#\*\s]+/, '')
                .trim();

              if (!cleanName || !/[\u4e00-\u9fa5a-zA-Z]/.test(cleanName)) {
                cleanName = `商品 ${items.length + 1}`;
              }

              items.push({
                productName: cleanName,
                barcode: first,
                quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
                unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                totalPrice: isNaN(totalPrice) ? parseFloat(((qty || 1) * (unitPrice || 0)).toFixed(2)) : totalPrice,
              });

              i += 2; // Consumed 2 lines
              continue;
            }
          }
        }

        // Subcase B: Two-line without barcode: Line i has Name, Line i+1 has "Qty UnitPrice TotalPrice"
        if (tokens.length === 3 && /[\u4e00-\u9fa5]/.test(line) && !line.match(/(合计|总计|找零|现金|件数|应付|交易时间)/)) {
          const nums = tokens.map((t) => parseFloat(t.replace(/[^\d\.]/g, ''))).filter((n) => !isNaN(n));
          if (nums.length === 3) {
            const cleanName = line.replace(/^[-\—\=\:\#\*\s]+/, '').trim();
            items.push({
              productName: cleanName,
              barcode: undefined,
              quantity: nums[0] <= 0 ? 1 : nums[0],
              unitPrice: nums[1],
              totalPrice: nums[2],
            });

            i += 2;
            continue;
          }
        }

        // Subcase C: Deruishi style: Line i has "ProductName" + "Barcode", Line i+1 has "Qty UnitPrice TotalPrice"
        const deruishiNameMatch = line.match(/^(.+?)(\d{11,14})\s*$/);
        if (deruishiNameMatch && tokens.length >= 2) {
          const name = deruishiNameMatch[1].trim();
          const barcode = deruishiNameMatch[2].trim();
          const nums = tokens.map((t) => parseFloat(t.replace(/[^\d\.]/g, ''))).filter((n) => !isNaN(n));

          if (nums.length >= 2) {
            const qty = nums[0];
            const unitPrice = nums.length >= 3 ? nums[1] : 0;
            const totalPrice = nums.length >= 3 ? nums[2] : nums[1];

            items.push({
              productName: name,
              barcode,
              quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
              unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
              totalPrice: isNaN(totalPrice) ? parseFloat(((qty || 1) * (unitPrice || 0)).toFixed(2)) : totalPrice,
            });

            i += 2;
            continue;
          }
        }
      }

      // --- STRATEGY 2: Single-Line with Barcode ---
      // "全麦吐司面包250g 6923456789012 1 10.00 10.00"
      const singleLineBarcodeMatch = line.match(/^([^\d\s].+?)\s+(\d{8,18})\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)$/);
      if (singleLineBarcodeMatch) {
        const name = singleLineBarcodeMatch[1].trim();
        const barcode = singleLineBarcodeMatch[2].trim();
        const qty = parseFloat(singleLineBarcodeMatch[3]);
        const unitPrice = parseFloat(singleLineBarcodeMatch[4]);
        const totalPrice = parseFloat(singleLineBarcodeMatch[5]);

        items.push({
          productName: name,
          barcode,
          quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
          totalPrice: isNaN(totalPrice) ? parseFloat(((qty || 1) * (unitPrice || 0)).toFixed(2)) : totalPrice,
        });

        i++;
        continue;
      }

      // --- STRATEGY 3: Traditional Single-Line without Barcode ---
      // "冰红茶500ml 2 3.50 7.00"
      const singleLineMatch = line.match(/^([^\d\s\=\-].+?)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)$/);
      if (singleLineMatch) {
        const name = singleLineMatch[1].trim();
        const qty = parseFloat(singleLineMatch[2]);
        const unitPrice = parseFloat(singleLineMatch[3]);
        const totalPrice = parseFloat(singleLineMatch[4]);

        if (!name.match(/(合计|总计|找零|现金|件数|应付|交易时间)/) && /[\u4e00-\u9fa5a-zA-Z]/.test(name)) {
          items.push({
            productName: name,
            barcode: undefined,
            quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
            totalPrice: isNaN(totalPrice) ? parseFloat(((qty || 1) * (unitPrice || 0)).toFixed(2)) : totalPrice,
          });
          i++;
          continue;
        }
      }

      i++;
    }

    return {
      storeName: detectedStoreName,
      receiptNumber: detectedReceiptNumber,
      date: detectedDate,
      totalAmount: detectedTotalAmount,
      totalQuantity: detectedTotalQuantity,
      itemCount: detectedItemCount || items.length,
      items,
      rawText: cleanedText,
    };
  }
}

export const ocrService = new OCRService();

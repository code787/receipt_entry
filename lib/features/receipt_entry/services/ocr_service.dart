import 'dart:io';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../../../data/models/receipt_item.dart';
import '../../../data/models/receipt_template.dart';

class OcrService {
  static final OcrService instance = OcrService._();
  OcrService._();

  final _textRecognizer = TextRecognizer(script: TextRecognitionScript.chinese);

  Future<String> recognizeText(String imagePath) async {
    final inputImage = InputImage.fromFilePath(imagePath);
    final recognizedText = await _textRecognizer.processImage(inputImage);
    return _cleanOcrText(recognizedText.text);
  }

  /// Clean OCR text to fix common issues
  String _cleanOcrText(String text) {
    var cleaned = text;

    // Fix "10. 90" → "10.90" (space after dot in numbers)
    cleaned = cleaned.replaceAllMapped(
      RegExp(r'(\d+)\.\s+(\d+)'),
      (m) => '${m.group(1)}.${m.group(2)}',
    );

    // Fix "10 ." → "10." (space before dot)
    cleaned = cleaned.replaceAllMapped(
      RegExp(r'(\d+)\s+\.(\d)'),
      (m) => '${m.group(1)}.${m.group(2)}',
    );

    // Clean barcode: remove all spaces from barcode lines (11-14 digits)
    cleaned = cleaned.replaceAllMapped(
      RegExp(r'^(\d[\d\s]{10,16}\d)$', multiLine: true),
      (m) => m.group(0)!.replaceAll(RegExp(r'\s'), ''),
    );

    return cleaned;
  }

  Future<List<ReceiptItem>> parseReceiptItems(String imagePath, {ReceiptTemplate? template}) async {
    final processedPath = await _preprocessImage(imagePath);
    final text = await recognizeText(processedPath);

    try {
      final processedFile = File(processedPath);
      if (await processedFile.exists() && processedPath != imagePath) {
        await processedFile.delete();
      }
    } catch (_) {}

    if (template != null) {
      return _parseWithTemplate(text, template);
    }
    return _parseTextToItems(text);
  }

  Future<String> _preprocessImage(String imagePath) async {
    return imagePath;
  }

  String? extractStoreName(String text) {
    final lines = text.split('\n');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) continue;
      if (trimmed.contains('店') && trimmed.length < 30 && !trimmed.contains('单号')) {
        return trimmed;
      }
    }
    return null;
  }

  String? extractReceiptNumber(String text) {
    final match = RegExp(r'单号[：:]\s*(\d+)').firstMatch(text);
    return match?.group(1);
  }

  List<ReceiptItem> _parseWithTemplate(String text, ReceiptTemplate template) {
    final items = <ReceiptItem>[];
    final lines = text.split('\n').map((l) => l.trim()).toList();

    RegExp? skipRegex;
    if (template.skipPattern != null && template.skipPattern!.isNotEmpty) {
      try {
        skipRegex = RegExp(template.skipPattern!, multiLine: true, caseSensitive: false);
      } catch (_) {}
    }

    RegExp? itemRegex;
    if (template.itemPattern != null && template.itemPattern!.isNotEmpty) {
      try {
        itemRegex = RegExp(template.itemPattern!, multiLine: true, caseSensitive: false);
      } catch (_) {}
    }

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.isEmpty) continue;
      if (skipRegex != null && skipRegex.hasMatch(line)) continue;
      if (itemRegex == null) continue;

      final match = itemRegex.firstMatch(line);
      if (match == null) continue;

      final name = _extractGroup(match, template.nameGroup);
      final qty = _extractGroup(match, template.qtyGroup);
      final unitPrice = _extractGroup(match, template.unitPriceGroup);
      final totalPrice = _extractGroup(match, template.totalPriceGroup);

      if (name == null || name.isEmpty) continue;

      // Extract barcode from next line
      String? barcode;
      if (i + 1 < lines.length) {
        final nextLine = lines[i + 1];
        final barcodeMatch = RegExp(r'^(\d{11,14})$').firstMatch(nextLine);
        if (barcodeMatch != null) {
          barcode = barcodeMatch.group(1);
        }
      }

      final parsedQty = qty != null ? (int.tryParse(qty) ?? 1) : 1;
      final parsedUnitPrice = unitPrice != null ? (double.tryParse(unitPrice) ?? 0.0) : 0.0;
      final parsedTotalPrice = totalPrice != null ? (double.tryParse(totalPrice) ?? 0.0) : 0.0;

      if (parsedTotalPrice <= 0 && parsedUnitPrice <= 0) continue;

      items.add(ReceiptItem(
        receiptId: 0,
        productName: name,
        barcode: barcode,
        quantity: parsedQty,
        unitPrice: parsedUnitPrice > 0 ? parsedUnitPrice : parsedTotalPrice,
        totalPrice: parsedTotalPrice > 0 ? parsedTotalPrice : parsedUnitPrice * parsedQty,
      ));
    }

    return items;
  }

  String? _extractGroup(Match match, String? groupStr) {
    if (groupStr == null || groupStr.isEmpty) return null;
    final groupIndex = int.tryParse(groupStr);
    if (groupIndex == null || groupIndex < 0 || groupIndex > match.groupCount) return null;
    return match.group(groupIndex);
  }

  List<ReceiptItem> _parseTextToItems(String text) {
    final items = <ReceiptItem>[];
    final lines = text.split('\n').map((l) => l.trim()).toList();

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.isEmpty) continue;

      // Skip barcode-only lines
      if (RegExp(r'^\d{11,14}$').hasMatch(line)) continue;

      if (_isNonItemLine(line)) continue;

      final item = _parseItemLine(line);
      if (item != null) {
        // Extract barcode from next line
        String? barcode;
        if (i + 1 < lines.length) {
          final nextLine = lines[i + 1];
          final barcodeMatch = RegExp(r'^(\d{11,14})$').firstMatch(nextLine);
          if (barcodeMatch != null) {
            barcode = barcodeMatch.group(1);
          }
        }

        items.add(item.copyWith(barcode: barcode));
      }
    }

    return items;
  }

  ReceiptItem? _parseItemLine(String line) {
    // Format 1: 商品名 + 价格（散称商品）
    final pattern1 = RegExp(r'^(.+?)\s+[-—]?\s*[¥￥]?\s*(\d+\.?\d*)\s*$');
    final match1 = pattern1.firstMatch(line);
    if (match1 != null) {
      final name = match1.group(1)!.trim();
      final price = double.parse(match1.group(2)!);
      if (_isValidItemName(name) && price > 0 && price < 10000) {
        return ReceiptItem(
          receiptId: 0,
          productName: name,
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
        );
      }
    }

    // Format 2: 商品名 + 数量. + 单价 + 金额（包装商品）
    final pattern2 = RegExp(r'^(.+?)\s+(\d+)\.?\s+[¥￥]?\s*(\d+\.?\d*)\s+[¥￥]?\s*(\d+\.?\d*)\s*$');
    final match2 = pattern2.firstMatch(line);
    if (match2 != null) {
      final name = match2.group(1)!.trim();
      final qty = int.parse(match2.group(2)!);
      final unitPrice = double.parse(match2.group(3)!);
      final totalPrice = double.parse(match2.group(4)!);
      if (_isValidItemName(name) && unitPrice > 0) {
        return ReceiptItem(
          receiptId: 0,
          productName: name,
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        );
      }
    }

    return null;
  }

  bool _isValidItemName(String name) {
    if (name.length < 2) return false;
    if (RegExp(r'^\d+\.?\d*$').hasMatch(name)) return false;

    final skipKeywords = [
      '合计', '总计', '小计', '找零', '回找', '实收', '原价',
      '现金', '微信', '支付宝', '银行卡', '会员', '抖音',
      '日期', '时间', '单号', '店号', '工号', '服务热线',
      '谢谢', '欢迎', '地址', '品名', '数量', '单价', '金额',
      '正常额', '特价格', '节省', '售出', '拨打', '热线',
      '扫码', '享会员', '如果', '商品', '服务', '满意',
      '二维码', 'qr',
    ];
    final lowerName = name.toLowerCase();
    for (final kw in skipKeywords) {
      if (lowerName.contains(kw.toLowerCase())) return false;
    }

    if (RegExp(r'^[\d\s.]+$').hasMatch(name)) return false;

    return true;
  }

  bool _isNonItemLine(String line) {
    final skipPatterns = [
      RegExp(r'店号'), RegExp(r'工号'), RegExp(r'单号'),
      RegExp(r'品名'), RegExp(r'合计'), RegExp(r'总计'),
      RegExp(r'实收'), RegExp(r'原价'), RegExp(r'回找'),
      RegExp(r'找零'), RegExp(r'微信'), RegExp(r'支付宝'),
      RegExp(r'抖音'), RegExp(r'会员'), RegExp(r'服务热线'),
      RegExp(r'拨打'), RegExp(r'热线'), RegExp(r'扫码'),
      RegExp(r'售出'), RegExp(r'正常额'), RegExp(r'特价格'),
      RegExp(r'节省'), RegExp(r'如果'), RegExp(r'满意'),
      RegExp(r'二维码'), RegExp(r'^\d{11,14}$'),
    ];

    for (final pattern in skipPatterns) {
      if (pattern.hasMatch(line)) return true;
    }
    return false;
  }

  void dispose() {
    _textRecognizer.close();
  }
}
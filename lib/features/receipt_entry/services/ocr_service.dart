import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../../../data/models/receipt_item.dart';

class OcrService {
  static final OcrService instance = OcrService._();
  OcrService._();

  final _textRecognizer = TextRecognizer(script: TextRecognitionScript.chinese);

  Future<String> recognizeText(String imagePath) async {
    final inputImage = InputImage.fromFilePath(imagePath);
    final recognizedText = await _textRecognizer.processImage(inputImage);
    return recognizedText.text;
  }

  Future<List<ReceiptItem>> parseReceiptItems(String imagePath) async {
    final text = await recognizeText(imagePath);
    return _parseTextToItems(text);
  }

  List<ReceiptItem> _parseTextToItems(String text) {
    final items = <ReceiptItem>[];
    final lines = text.split('\n');

    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) continue;

      final item = _parseLine(trimmed);
      if (item != null) {
        items.add(item);
      }
    }

    return items;
  }

  ReceiptItem? _parseLine(String line) {
    // Try to match patterns like:
    // "商品名 x2 ¥25.00" or "商品名 2 25.00" or "商品名 25.00"
    // Common receipt formats:
    // "可口可乐 x2 25.00"
    // "可口可乐 2 25.00"
    // "可口可乐 ￥25.00"
    // "可口可乐 25.00"
    // "可口可乐*2 25.00"

    // Pattern 1: name x{quantity} {price} or name {quantity} {price}
    final pattern1 = RegExp(r'^(.+?)\s*[xX×]\s*(\d+)\s+[¥￥]?\s*(\d+\.?\d*)$');
    final match1 = pattern1.firstMatch(line);
    if (match1 != null) {
      final name = match1.group(1)!.trim();
      final qty = int.parse(match1.group(2)!);
      final price = double.parse(match1.group(3)!);
      if (_isValidItemName(name) && price > 0) {
        return ReceiptItem(
          receiptId: 0,
          productName: name,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price,
        );
      }
    }

    // Pattern 2: name {quantity} {price}
    final pattern2 = RegExp(r'^(.+?)\s+(\d+)\s+[¥￥]?\s*(\d+\.?\d*)$');
    final match2 = pattern2.firstMatch(line);
    if (match2 != null) {
      final name = match2.group(1)!.trim();
      final qty = int.parse(match2.group(2)!);
      final price = double.parse(match2.group(3)!);
      if (_isValidItemName(name) && price > 0) {
        return ReceiptItem(
          receiptId: 0,
          productName: name,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price,
        );
      }
    }

    // Pattern 3: name [¥￥]{price}
    final pattern3 = RegExp(r'^(.+?)\s+[¥￥]\s*(\d+\.?\d*)$');
    final match3 = pattern3.firstMatch(line);
    if (match3 != null) {
      final name = match3.group(1)!.trim();
      final price = double.parse(match3.group(2)!);
      if (_isValidItemName(name) && price > 0) {
        return ReceiptItem(
          receiptId: 0,
          productName: name,
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
        );
      }
    }

    // Pattern 4: name {price}
    final pattern4 = RegExp(r'^(.+?)\s+(\d+\.?\d*)$');
    final match4 = pattern4.firstMatch(line);
    if (match4 != null) {
      final name = match4.group(1)!.trim();
      final price = double.parse(match4.group(2)!);
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

    return null;
  }

  bool _isValidItemName(String name) {
    // Filter out non-item lines
    if (name.length < 2) return false;
    if (RegExp(r'^\d+\.?\d*$').hasMatch(name)) return false;
    if (name.contains('合计') || name.contains('总计') || name.contains('小计')) return false;
    if (name.contains('找零') || name.contains('现金') || name.contains('微信')) return false;
    if (name.contains('支付宝') || name.contains('银行卡') || name.contains('会员')) return false;
    if (name.contains('日期') || name.contains('时间') || name.contains('单号')) return false;
    if (name.contains('谢谢') || name.contains('欢迎') || name.contains('地址')) return false;
    return true;
  }

  void dispose() {
    _textRecognizer.close();
  }
}
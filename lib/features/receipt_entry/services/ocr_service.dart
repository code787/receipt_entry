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

  String? extractStoreName(String text) {
    final lines = text.split('\n');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) continue;
      if (trimmed.contains('店') && trimmed.length < 30) {
        return trimmed;
      }
    }
    return null;
  }

  String? extractReceiptNumber(String text) {
    final match = RegExp(r'单号[：:]\s*(\d+)').firstMatch(text);
    return match?.group(1);
  }

  List<ReceiptItem> _parseTextToItems(String text) {
    final items = <ReceiptItem>[];
    final lines = text.split('\n').map((l) => l.trim()).toList();

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.isEmpty) continue;

      // Skip barcode lines (pure digits, 11-14 digits)
      if (RegExp(r'^\d{11,14}$').hasMatch(line)) continue;

      // Skip header/footer lines
      if (_isNonItemLine(line)) continue;

      // Try to parse as an item line
      final item = _parseItemLine(line);
      if (item != null) {
        items.add(item);
      }
    }

    return items;
  }

  ReceiptItem? _parseItemLine(String line) {
    // Format 1: 商品名 + 条码在下一行，价格在行尾（散称商品）
    // "爱乡亲面包/kg          3.48"
    // Pattern: name + spaces/tabs + price (possibly with dash placeholder for qty)
    final pattern1 = RegExp(
      r'^(.+?)\s+[-—]?\s*[¥￥]?\s*(\d+\.?\d*)\s*$',
    );
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

    // Format 2: 商品名 + 数量 + 单价 + 金额（包装商品）
    // "七度空间天山绒棉极薄日用250mm/包  1. 10.90 10.90"
    // "高洁丝海岛奢宠纯棉卫生巾280/包  1. 16.90 16.90"
    final pattern2 = RegExp(
      r'^(.+?)\s+(\d+)\.?\s+[¥￥]?\s*(\d+\.?\d*)\s+[¥￥]?\s*(\d+\.?\d*)\s*$',
    );
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

    // Format 3: 商品名 + 数量 + 单价 + 金额（without dot after qty）
    // "ABC纤薄棉柔夜用8片/包 1 5.90 5.90"
    final pattern3 = RegExp(
      r'^(.+?)\s+(\d+)\s+[¥￥]?\s*(\d+\.?\d*)\s+[¥￥]?\s*(\d+\.?\d*)\s*$',
    );
    final match3 = pattern3.firstMatch(line);
    if (match3 != null) {
      final name = match3.group(1)!.trim();
      final qty = int.parse(match3.group(2)!);
      final unitPrice = double.parse(match3.group(3)!);
      final totalPrice = double.parse(match3.group(4)!);
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

    // Format 4: Simple "name  price" (for items with only total price)
    // "沙琪 土豆/kg          1.47"
    final pattern4 = RegExp(
      r'^(.+?)\s+[¥￥]?\s*(\d+\.\d{2})\s*$',
    );
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
    if (name.length < 2) return false;
    if (RegExp(r'^\d+\.?\d*$').hasMatch(name)) return false;

    // Filter out non-item keywords
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

    // Filter out lines that are just numbers/barcodes
    if (RegExp(r'^[\d\s.]+$').hasMatch(name)) return false;

    return true;
  }

  bool _isNonItemLine(String line) {
    // Header/footer patterns to skip
    final skipPatterns = [
      RegExp(r'店号'), RegExp(r'工号'), RegExp(r'单号'),
      RegExp(r'品名'), RegExp(r'合计'), RegExp(r'总计'),
      RegExp(r'实收'), RegExp(r'原价'), RegExp(r'回找'),
      RegExp(r'找零'), RegExp(r'微信'), RegExp(r'支付宝'),
      RegExp(r'抖音'), RegExp(r'会员'), RegExp(r'服务热线'),
      RegExp(r'拨打'), RegExp(r'热线'), RegExp(r'扫码'),
      RegExp(r'售出'), RegExp(r'正常额'), RegExp(r'特价格'),
      RegExp(r'节省'), RegExp(r'如果'), RegExp(r'满意'),
      RegExp(r'二维码'), RegExp(r'^\d{11,14}$'), // barcodes
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
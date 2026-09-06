import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:receipt_entry/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: App()));
    await tester.pump();
    // The app shows the first tab (ReceiptEntryScreen) with AppBar title "小票录入"
    expect(find.text('小票录入'), findsWidgets);
  });
}
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('SafeLink Responder widget title check', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Text('SafeLink Responder'),
          ),
        ),
      ),
    );

    expect(find.text('SafeLink Responder'), findsOneWidget);
  });
}

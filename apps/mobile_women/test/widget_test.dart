import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_women/src/features/emergency/widgets/sos_hold_button.dart';

void main() {
  testWidgets('SosHoldButton renders correctly with SOS label', (WidgetTester tester) async {
    bool triggered = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SosHoldButton(
            onTriggered: () {
              triggered = true;
            },
          ),
        ),
      ),
    );

    expect(find.text('SOS'), findsOneWidget);
    expect(find.text('HOLD 1.5s'), findsOneWidget);
    expect(triggered, false);
  });
}

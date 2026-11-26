import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/background_service.dart';
import 'src/core/notification_service.dart';
import 'src/core/theme.dart';
import 'src/router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.ensureInitialized();
  await VolunteerBackgroundService.initialize();
  runApp(const ProviderScope(child: SafeLinkVolunteerApp()));
}

class SafeLinkVolunteerApp extends ConsumerWidget {
  const SafeLinkVolunteerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'SafeLink Responder',
      theme: SafeLinkVolunteerTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
    );
  }
}

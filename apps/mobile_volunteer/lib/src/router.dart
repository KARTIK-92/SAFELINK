import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/volunteer_dashboard_screen.dart';
import 'features/response/active_response_screen.dart';
import 'features/settings/volunteer_settings_screen.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  void trigger() => notifyListeners();
}

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier();
  ref.listen<AuthState>(authControllerProvider, (_, __) {
    refreshNotifier.trigger();
  });
  ref.onDispose(refreshNotifier.dispose);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refreshNotifier,
    redirect: (BuildContext context, GoRouterState state) {
      final authState = ref.read(authControllerProvider);
      final loc = state.matchedLocation;

      if (authState.isLoading) {
        return loc == '/splash' ? null : '/splash';
      }

      final isAuthenticated = authState.isAuthenticated;

      if (!isAuthenticated) {
        return loc == '/login' ? null : '/login';
      }

      if (loc == '/login' || loc == '/splash') {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const _SessionBootScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const VolunteerDashboardScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const VolunteerLoginScreen(),
      ),
      GoRoute(
        path: '/active-response',
        builder: (context, state) => const ActiveResponseScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const VolunteerSettingsScreen(),
      ),
    ],
  );
});

class _SessionBootScreen extends StatelessWidget {
  const _SessionBootScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.canvasCream,
      body: Center(
        child: CircularProgressIndicator(color: AppColors.midnightNavy),
      ),
    );
  }
}

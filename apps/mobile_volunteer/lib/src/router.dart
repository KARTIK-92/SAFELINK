import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/volunteer_dashboard_screen.dart';
import 'features/response/active_response_screen.dart';
import 'features/settings/volunteer_settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (BuildContext context, GoRouterState state) {
      if (authState.isLoading) return null;

      final isLoggingIn = state.matchedLocation == '/login';
      final isAuthenticated = authState.isAuthenticated;

      if (!isAuthenticated && !isLoggingIn) {
        return '/login';
      }

      if (isAuthenticated && isLoggingIn) {
        return '/';
      }

      return null;
    },
    routes: [
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

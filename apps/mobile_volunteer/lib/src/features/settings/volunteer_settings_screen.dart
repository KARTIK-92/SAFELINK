import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import '../auth/auth_controller.dart';
import '../dashboard/volunteer_controller.dart';

class VolunteerSettingsScreen extends ConsumerWidget {
  const VolunteerSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;
    final phone = user?['phone'] ?? '+919888800002';
    final email = user?['email'] ?? 'rajesh.vol@example.com';

    return Scaffold(
      backgroundColor: AppColors.canvasCream,
      appBar: AppBar(
        title: const Text('Responder Settings'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Volunteer Identity Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.brandTeal,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.volunteer_activism, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Verified Community Volunteer',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.midnightNavy,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(phone, style: const TextStyle(fontSize: 13, color: AppColors.slateNeutral)),
                          Text(email, style: const TextStyle(fontSize: 12, color: AppColors.slateNeutral)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.emerald.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, size: 14, color: Colors.emerald),
                          SizedBox(width: 4),
                          Text(
                            'Active',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.emerald,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Code of Conduct & Safety Directives
              const Text(
                'Responder Safety Directives',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.midnightNavy,
                ),
              ),
              const SizedBox(height: 8),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Column(
                  children: [
                    _DirectiveItem(
                      icon: Icons.shield_outlined,
                      title: 'Never Engage in Physical Violence',
                      subtitle: 'Your primary function is rapid presence, witness deterrence, and alerting official emergency services.',
                    ),
                    Divider(height: 20),
                    _DirectiveItem(
                      icon: Icons.phone_in_talk,
                      title: 'Call 112 for Critical Threats',
                      subtitle: 'If weapons or escalating violence are present, contact official police immediately and maintain distance.',
                    ),
                    Divider(height: 20),
                    _DirectiveItem(
                      icon: Icons.lock_outline,
                      title: 'Strict Confidentiality',
                      subtitle: 'Never share member names, locations, or incident details publicly or on social media.',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Sign Out Button
              OutlinedButton.icon(
                onPressed: () async {
                  ref.read(volunteerControllerProvider.notifier).toggleAvailability(false);
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                icon: const Icon(Icons.logout, color: AppColors.emergencyRed),
                label: const Text(
                  'SIGN OUT AS VOLUNTEER',
                  style: TextStyle(
                    color: AppColors.emergencyRed,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const Border.all(color: AppColors.emergencyRed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DirectiveItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _DirectiveItem({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.brandTeal),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.midnightNavy,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 12, color: AppColors.slateNeutral, height: 1.3),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

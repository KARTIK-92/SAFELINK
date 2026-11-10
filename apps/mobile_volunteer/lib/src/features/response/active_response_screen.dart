import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import '../dashboard/volunteer_controller.dart';

class ActiveResponseScreen extends ConsumerWidget {
  const ActiveResponseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final volunteerState = ref.watch(volunteerControllerProvider);
    final volunteerNotifier = ref.read(volunteerControllerProvider.notifier);

    final active = volunteerState.activeIncident;

    if (active == null) {
      return Scaffold(
        backgroundColor: AppColors.canvasCream,
        appBar: AppBar(title: const Text('Emergency Response')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline, size: 60, color: Colors.green),
                const SizedBox(height: 16),
                const Text(
                  'No Active Emergency Assignment',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.midnightNavy),
                ),
                const SizedBox(height: 8),
                const Text(
                  'The incident may have concluded or the member reached safety.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.slateNeutral, fontSize: 13),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.go('/'),
                  child: const Text('RETURN TO DASHBOARD'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final victimName = active['victim_display_name'] ?? 'SafeLink Member';
    final address = active['address_snapshot'] ?? 'Near MG Road Metro';
    final lat = (active['latitude'] as num?)?.toDouble() ?? 12.9716;
    final lon = (active['longitude'] as num?)?.toDouble() ?? 77.5946;
    final currentStatus = active['response_status'] ?? 'accepted';

    return Scaffold(
      backgroundColor: AppColors.canvasCream,
      appBar: AppBar(
        title: const Text('Dispatch Navigation'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Critical Alert Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.emergencyRed,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.emergencyRed.withOpacity(0.25),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.shield_outlined, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'EMERGENCY IN PROGRESS',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            'Proceed with care. Human presence makes a critical difference.',
                            style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Member Details & Coordinates Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppColors.emergencyRed.withOpacity(0.12),
                          radius: 20,
                          child: Text(
                            victimName[0],
                            style: const TextStyle(
                              color: AppColors.emergencyRed,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                victimName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.midnightNavy,
                                ),
                              ),
                              const Text(
                                'Member requested immediate nearby assistance',
                                style: TextStyle(fontSize: 12, color: AppColors.slateNeutral),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: AppColors.brandTeal, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            address,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.midnightNavy,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Target GPS: ${lat.toStringAsFixed(5)}, ${lon.toStringAsFixed(5)}',
                      style: const TextStyle(fontSize: 12, color: AppColors.slateNeutral),
                    ),
                    const SizedBox(height: 16),

                    // Launch Google Maps Button
                    ElevatedButton.icon(
                      onPressed: () => volunteerNotifier.openGoogleMapsNavigation(lat, lon),
                      icon: const Icon(Icons.directions, color: Colors.white),
                      label: const Text(
                        'NAVIGATE IN GOOGLE MAPS',
                        style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandTeal,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Milestone Status Progression
              const Text(
                'Update Your Milestone Status',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.midnightNavy,
                ),
              ),
              const SizedBox(height: 10),

              _buildStatusButton(
                title: '1. I Am On The Way',
                statusKey: 'on_the_way',
                isActive: currentStatus == 'on_the_way',
                isCompleted: currentStatus == 'reached_location' || currentStatus == 'assistance_completed',
                onTap: () => volunteerNotifier.updateResponseStatus('on_the_way'),
              ),
              const SizedBox(height: 8),

              _buildStatusButton(
                title: '2. I Have Reached The Location',
                statusKey: 'reached_location',
                isActive: currentStatus == 'reached_location',
                isCompleted: currentStatus == 'assistance_completed',
                onTap: () => volunteerNotifier.updateResponseStatus('reached_location'),
              ),
              const SizedBox(height: 8),

              _buildStatusButton(
                title: '3. Assistance Completed (Situation Safe)',
                statusKey: 'assistance_completed',
                isActive: false,
                isCompleted: false,
                isFinal: true,
                onTap: () async {
                  final ok = await volunteerNotifier.updateResponseStatus('assistance_completed');
                  if (ok && context.mounted) {
                    context.go('/');
                  }
                },
              ),

              const SizedBox(height: 24),

              // Threat Escalation: Call 112
              OutlinedButton.icon(
                onPressed: () => volunteerNotifier.call112(),
                icon: const Icon(Icons.phone, color: AppColors.emergencyRed),
                label: const Text(
                  'CALL 112 (OFFICIAL POLICE HELPLINE)',
                  style: TextStyle(color: AppColors.emergencyRed, fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const Border.all(color: AppColors.emergencyRed, width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  backgroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusButton({
    required String title,
    required String statusKey,
    required bool isActive,
    required bool isCompleted,
    bool isFinal = false,
    required VoidCallback onTap,
  }) {
    Color bg = Colors.white;
    Color border = const Color(0xFFE2E8F0);
    Color text = AppColors.midnightNavy;
    IconData icon = Icons.circle_outlined;

    if (isCompleted) {
      bg = Colors.emerald.withOpacity(0.08);
      border = Colors.emerald.withOpacity(0.3);
      text = Colors.emerald.shade800;
      icon = Icons.check_circle;
    } else if (isActive) {
      bg = AppColors.brandTeal.withOpacity(0.1);
      border = AppColors.brandTeal;
      text = AppColors.brandTeal;
      icon = Icons.radio_button_checked;
    } else if (isFinal) {
      border = AppColors.midnightNavy;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border, width: isActive ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: text),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isActive || isFinal ? FontWeight.bold : FontWeight.w600,
                  color: text,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

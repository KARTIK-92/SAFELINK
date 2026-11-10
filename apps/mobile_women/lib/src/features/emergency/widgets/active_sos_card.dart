import 'package:flutter/material.dart';
import 'package:shared_dart/shared_dart.dart';
import '../emergency_controller.dart';

class ActiveSosCard extends StatelessWidget {
  final EmergencyState state;

  const ActiveSosCard({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final lat = state.lastPosition?.latitude.toStringAsFixed(5) ?? '--';
    final lon = state.lastPosition?.longitude.toStringAsFixed(5) ?? '--';
    final acc = state.lastPosition?.accuracy.round() ?? 10;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.emergencyRed, width: 2),
        boxShadow: [
          BoxShadow(
            color: AppColors.emergencyRed.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Flashing Status Indicator
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.emergencyRed,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'SOS ACTIVE • LIVE LOCATION STREAMING',
                  style: TextStyle(
                    color: AppColors.emergencyRed,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Notification summary metrics
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildMetric(
                  icon: Icons.people_alt_outlined,
                  value: '${state.contactsNotified}',
                  label: 'Family Contacts\nNotified',
                ),
                Container(width: 1, height: 32, color: const Color(0xFFFECACA)),
                _buildMetric(
                  icon: Icons.verified_user_outlined,
                  value: '${state.volunteersNotified}',
                  label: 'Nearby Volunteers\nDispatched',
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Continuous GPS details
          Row(
            children: [
              const Icon(Icons.gps_fixed, size: 16, color: AppColors.brandTeal),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Live GPS: $lat, $lon (±${acc}m accuracy)',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.slateNeutral,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetric({
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: AppColors.emergencyRed),
            const SizedBox(width: 6),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.midnightNavy,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.slateNeutral,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

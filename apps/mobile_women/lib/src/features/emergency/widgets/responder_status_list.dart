import 'package:flutter/material.dart';
import 'package:shared_dart/shared_dart.dart';

class ResponderStatusList extends StatelessWidget {
  final List<Map<String, dynamic>> responders;

  const ResponderStatusList({super.key, required this.responders});

  @override
  Widget build(BuildContext context) {
    if (responders.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.brandTeal,
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Waiting for nearby verified volunteers to accept...',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.slateNeutral,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text(
                'Coordinating Responders',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppColors.midnightNavy,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brandTeal.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${responders.length} Active',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.brandTeal,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: responders.length,
            separatorBuilder: (_, __) => const Divider(height: 16),
            itemBuilder: (context, index) {
              final r = responders[index];
              final status = r['status'] as String? ?? 'accepted';
              return Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: _statusColor(status).withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _statusIcon(status),
                      size: 20,
                      color: _statusColor(status),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Verified Volunteer #${index + 1}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.midnightNavy,
                          ),
                        ),
                        Text(
                          _formatStatus(status),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _statusColor(status),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'reached_location':
        return Colors.green;
      case 'on_the_way':
        return Colors.blue;
      case 'accepted':
      default:
        return AppColors.brandTeal;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'reached_location':
        return Icons.location_on;
      case 'on_the_way':
        return Icons.directions_run;
      case 'accepted':
      default:
        return Icons.check_circle_outline;
    }
  }

  String _formatStatus(String status) {
    switch (status) {
      case 'reached_location':
        return 'Arrived at your location';
      case 'on_the_way':
        return 'On the way to you';
      case 'accepted':
      default:
        return 'Accepted • Preparing dispatch';
    }
  }
}

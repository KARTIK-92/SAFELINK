import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import '../../core/background_service.dart';
import '../../core/location_service.dart';
import '../../core/notification_service.dart';
import 'volunteer_controller.dart';

class VolunteerDashboardScreen extends ConsumerStatefulWidget {
  const VolunteerDashboardScreen({super.key});

  @override
  ConsumerState<VolunteerDashboardScreen> createState() =>
      _VolunteerDashboardScreenState();
}

class _VolunteerDashboardScreenState
    extends ConsumerState<VolunteerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Request notification bar permission (Android 13+) and start radar service
      await NotificationService.requestPermission();
      await VolunteerBackgroundService.startIfAuthenticated();

      // Request foreground location permission & send initial GPS fix
      final granted = await ref.read(locationServiceProvider).ensurePermission();
      if (granted) {
        final pos = await ref.read(locationServiceProvider).warmUpLocation();
        if (pos != null && mounted) {
          ref.read(volunteerControllerProvider.notifier).reportCurrentPosition(pos);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final volunteerState = ref.watch(volunteerControllerProvider);
    final volunteerNotifier = ref.read(volunteerControllerProvider.notifier);

    final totalResponded =
        volunteerState.profile?['total_incidents_responded'] ?? 0;
    final activeIncident = volunteerState.activeIncident;

    return Scaffold(
      backgroundColor: AppColors.canvasCream,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.brandTeal,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.volunteer_activism,
                  size: 18, color: Colors.white),
            ),
            const SizedBox(width: 8),
            const Text(
              'SafeLink Responder',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AppColors.midnightNavy),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined,
                color: AppColors.midnightNavy),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Active Emergency Assignment Card (if currently responding)
              if (activeIncident != null) ...[
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.emergencyRed,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.emergencyRed.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.warning_amber_rounded,
                              color: Colors.white, size: 24),
                          SizedBox(width: 8),
                          Text(
                            'ACTIVE EMERGENCY DISPATCH',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Responding to: ${activeIncident['victim_display_name'] ?? 'SafeLink Member'}',
                        style:
                            const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/active-response'),
                        icon: const Icon(Icons.navigation,
                            color: AppColors.midnightNavy, size: 18),
                        label: const Text(
                          'OPEN DISPATCH NAVIGATION',
                          style: TextStyle(
                            color: AppColors.midnightNavy,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],

              // Error Banner if any
              if (volunteerState.errorMessage != null) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Text(
                    volunteerState.errorMessage!,
                    style: const TextStyle(
                        color: AppColors.emergencyRed,
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],

              // Always-Active Radar Banner (no online/offline toggle needed)
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.brandTeal, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brandTeal.withOpacity(0.10),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.radar, color: Colors.green, size: 22),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'RESPONDER RADAR ACTIVE',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                              letterSpacing: 0.5,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'You will receive instant alerts in your notification bar when someone nearby needs help. Accept only if you can respond.',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppColors.slateNeutral,
                                height: 1.3),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // GPS Readiness Status Pill
              Container(
                margin: const EdgeInsets.only(top: 10),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: volunteerState.lastPosition != null
                        ? Colors.green.shade300
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      volunteerState.lastPosition != null
                          ? Icons.gps_fixed
                          : Icons.location_on_outlined,
                      color: volunteerState.lastPosition != null
                          ? Colors.green.shade600
                          : AppColors.brandTeal,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        volunteerState.lastPosition != null
                            ? 'GPS Ready (${volunteerState.lastPosition!.latitude.toStringAsFixed(4)}, ${volunteerState.lastPosition!.longitude.toStringAsFixed(4)}) • Real-time location reported to dispatch radar'
                            : 'GPS Standby • Device location ready for nearby dispatches',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: volunteerState.lastPosition != null
                              ? AppColors.midnightNavy
                              : AppColors.slateNeutral,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Volunteer Credentials Metric Strip
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildMetric('Verified Responder', Icons.verified_user,
                        AppColors.emerald),
                    Container(
                        width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                    _buildMetric('$totalResponded Dispatches',
                        Icons.checklist_rtl, AppColors.midnightNavy),
                    Container(
                        width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                    _buildMetric('First Aid Trained',
                        Icons.medical_services_outlined, AppColors.brandTeal),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Candidate Incidents Heading
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Nearby Emergency Dispatches',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.midnightNavy,
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppColors.brandTeal),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Listening Live',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppColors.brandTeal,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Candidate List or Empty State
              if (volunteerState.candidateIncidents.isEmpty)
                _buildZeroIncidentsNotice()
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: volunteerState.candidateIncidents.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = volunteerState.candidateIncidents[index];
                    final incidentId = item['incident_id'] as String;
                    final dist = item['approximate_distance_meters'] ?? 250;
                    final address = item['address_hint'] ?? 'Nearby location';

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: const Color(0xFFFCA5A5), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.06),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEE2E2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.emergency,
                                    color: AppColors.emergencyRed, size: 20),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Emergency Alert: ~$dist meters away',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.midnightNavy,
                                      ),
                                    ),
                                    Text(
                                      address,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.slateNeutral),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Strict Privacy Guarantee: Precise GPS and victim details unlock only after accepting.',
                            style: TextStyle(
                                fontSize: 11,
                                color: AppColors.slateNeutral,
                                fontStyle: FontStyle.italic),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () =>
                                      volunteerNotifier.declineIncident(incidentId),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.slateNeutral,
                                    side: const BorderSide(
                                        color: Color(0xFFCBD5E1)),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                  ),
                                  child: const Text('DECLINE'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 2,
                                child: ElevatedButton(
                                  onPressed: () async {
                                    final ok = await volunteerNotifier
                                        .acceptIncident(incidentId);
                                    if (ok && context.mounted) {
                                      context.push('/active-response');
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.brandTeal,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                  ),
                                  child: const Text(
                                    'ACCEPT DISPATCH',
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetric(String label, IconData icon, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }

  Widget _buildZeroIncidentsNotice() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.verified_outlined, size: 36, color: AppColors.brandTeal),
          SizedBox(height: 12),
          Text(
            'All Clear Nearby',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: AppColors.midnightNavy),
          ),
          SizedBox(height: 4),
          Text(
            'No active emergency requests right now. You will receive an urgent alert in your phone notification bar whenever someone nearby needs help.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 12, color: AppColors.slateNeutral, height: 1.4),
          ),
        ],
      ),
    );
  }
}

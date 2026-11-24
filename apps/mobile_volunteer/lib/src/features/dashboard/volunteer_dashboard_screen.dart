import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import '../../core/location_service.dart';
import 'volunteer_controller.dart';

class VolunteerDashboardScreen extends ConsumerStatefulWidget {
  const VolunteerDashboardScreen({super.key});

  @override
  ConsumerState<VolunteerDashboardScreen> createState() => _VolunteerDashboardScreenState();
}

class _VolunteerDashboardScreenState extends ConsumerState<VolunteerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(locationServiceProvider).ensurePermission().then((granted) {
        if (granted) {
          ref.read(locationServiceProvider).warmUpLocation().then((pos) {
            if (pos != null && mounted) {
              ref.read(volunteerControllerProvider.notifier).reportCurrentPosition(pos);
            }
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final volunteerState = ref.watch(volunteerControllerProvider);
    final volunteerNotifier = ref.read(volunteerControllerProvider.notifier);

    final isAvailable = volunteerState.isAvailable;
    final totalResponded = volunteerState.profile?['total_incidents_responded'] ?? 0;
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
              child: const Icon(Icons.volunteer_activism, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 8),
            const Text(
              'SafeLink Responder',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.midnightNavy),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.midnightNavy),
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
                          Icon(Icons.warning_amber_rounded, color: Colors.white, size: 24),
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
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/active-response'),
                        icon: const Icon(Icons.navigation, color: AppColors.midnightNavy, size: 18),
                        label: const Text(
                          'OPEN DISPATCH NAVIGATION',
                          style: TextStyle(
                            color: AppColors.midnightNavy,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],

              // Availability Toggle Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isAvailable ? AppColors.brandTeal : const Color(0xFFE2E8F0),
                    width: isAvailable ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isAvailable
                          ? AppColors.brandTeal.withOpacity(0.12)
                          : Colors.black.withOpacity(0.02),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isAvailable ? Colors.green : AppColors.slateNeutral,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                isAvailable ? 'STATUS: AVAILABLE' : 'STATUS: OFFLINE',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: isAvailable ? Colors.green : AppColors.midnightNavy,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isAvailable
                                ? 'Reporting battery-aware location & listening for nearby alerts within 1 km.'
                                : 'Switch to Available to receive alerts when someone nearby requires help.',
                            style: const TextStyle(fontSize: 12, color: AppColors.slateNeutral, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Switch(
                      value: isAvailable,
                      onChanged: (val) => volunteerNotifier.toggleAvailability(val),
                      activeColor: AppColors.brandTeal,
                    ),
                  ],
                ),
              ),

              // GPS Readiness Status Pill
              Container(
                margin: const EdgeInsets.only(top: 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: volunteerState.lastPosition != null ? Colors.green.shade300 : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      volunteerState.lastPosition != null ? Icons.gps_fixed : Icons.location_on_outlined,
                      color: volunteerState.lastPosition != null ? Colors.green.shade600 : AppColors.brandTeal,
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
                          color: volunteerState.lastPosition != null ? AppColors.midnightNavy : AppColors.slateNeutral,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Volunteer Credentials Metric Strip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildMetric('Verified Responder', Icons.verified_user, AppColors.emerald),
                    Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                    _buildMetric('$totalResponded Dispatches', Icons.checklist_rtl, AppColors.midnightNavy),
                    Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                    _buildMetric('First Aid Trained', Icons.medical_services_outlined, AppColors.brandTeal),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Candidate Incidents Heading
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Nearby Emergency Dispatches',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.midnightNavy,
                    ),
                  ),
                  if (isAvailable)
                    const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brandTeal),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Radar Active (1 km)',
                          style: TextStyle(fontSize: 11, color: AppColors.brandTeal, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Candidate List or Empty State
              if (!isAvailable)
                _buildOfflineNotice()
              else if (volunteerState.candidateIncidents.isEmpty)
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
                    final address = item['address_hint'] ?? 'Near MG Road';

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFCA5A5), width: 1.5),
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
                                child: const Icon(Icons.emergency, color: AppColors.emergencyRed, size: 20),
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
                                      style: const TextStyle(fontSize: 12, color: AppColors.slateNeutral),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Strict Privacy Guarantee: Precise GPS and victim details unlock only after accepting.',
                            style: TextStyle(fontSize: 11, color: AppColors.slateNeutral, fontStyle: FontStyle.italic),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => volunteerNotifier.declineIncident(incidentId),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.slateNeutral,
                                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('DECLINE'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 2,
                                child: ElevatedButton(
                                  onPressed: () async {
                                    final ok = await volunteerNotifier.acceptIncident(incidentId);
                                    if (ok && context.mounted) {
                                      context.push('/active-response');
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.brandTeal,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }

  Widget _buildOfflineNotice() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.bedtime_outlined, size: 36, color: AppColors.slateNeutral),
          SizedBox(height: 12),
          Text(
            'You are Offline',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.midnightNavy),
          ),
          SizedBox(height: 4),
          Text(
            'Location reporting is completely paused. Switch availability toggle to ON when ready to help.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppColors.slateNeutral, height: 1.4),
          ),
        ],
      ),
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
            'All Clear in Your Proximity',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.midnightNavy),
          ),
          SizedBox(height: 4),
          Text(
            'No active emergency alerts within ~1 km. Keep your phone nearby; you will receive a loud buzzer if someone needs help.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppColors.slateNeutral, height: 1.4),
          ),
        ],
      ),
    );
  }
}

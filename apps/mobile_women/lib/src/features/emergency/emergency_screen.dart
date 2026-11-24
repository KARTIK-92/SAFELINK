import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_dart/shared_dart.dart';
import '../../core/location_service.dart';
import 'emergency_controller.dart';
import 'widgets/sos_hold_button.dart';
import 'widgets/active_sos_card.dart';
import 'widgets/responder_status_list.dart';

class EmergencyScreen extends ConsumerStatefulWidget {
  const EmergencyScreen({super.key});

  @override
  ConsumerState<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends ConsumerState<EmergencyScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(locationServiceProvider).ensurePermission().then((granted) {
        if (granted) {
          ref.read(locationServiceProvider).warmUpLocation().then((pos) {
            if (pos != null && mounted) {
              ref.read(emergencyControllerProvider.notifier).updateCachedPosition(pos);
            }
          });
        }
      });
    });
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_outline, color: Colors.green),
            SizedBox(width: 8),
            Text('Are you safe now?'),
          ],
        ),
        content: const Text(
          'Cancelling the emergency will immediately revoke shared live-location tracking and notify responding volunteers that you have reached safety.',
          style: TextStyle(fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('KEEP ALERT ACTIVE', style: TextStyle(color: AppColors.slateNeutral)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogCtx).pop();
              ref.read(emergencyControllerProvider.notifier).cancelEmergency('User marked self safe');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.midnightNavy,
              foregroundColor: Colors.white,
            ),
            child: const Text('YES, I AM SAFE'),
          ),
        ],
      ),
    );
  }

  void _shareTrackingLink(BuildContext context, String? trackingUrl) {
    if (trackingUrl == null || trackingUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Generating live tracking link...')),
      );
      return;
    }
    Clipboard.setData(ClipboardData(text: trackingUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Live link copied to clipboard:\n$trackingUrl\nPaste & share with family on WhatsApp/SMS.'),
        duration: const Duration(seconds: 4),
        backgroundColor: AppColors.midnightNavy,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final emergencyState = ref.watch(emergencyControllerProvider);
    final emergencyNotifier = ref.read(emergencyControllerProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.canvasCream,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.midnightNavy,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shield_rounded, size: 18, color: AppColors.brandTeal),
            ),
            const SizedBox(width: 8),
            const Text(
              'SafeLink',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.midnightNavy),
            ),
          ],
        ),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.midnightNavy),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: emergencyState.isActive
              ? _buildActiveView(context, emergencyState, emergencyNotifier)
              : _buildIdleView(context, emergencyState, emergencyNotifier),
        ),
      ),
    );
  }

  Widget _buildIdleView(
    BuildContext context,
    EmergencyState state,
    EmergencyController notifier,
  ) {
    final hasGps = state.lastPosition != null;
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Privacy & Readiness Status Pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: hasGps ? Colors.green.shade300 : const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(
                hasGps ? Icons.gps_fixed : Icons.location_on_outlined,
                color: hasGps ? Colors.green.shade600 : AppColors.brandTeal,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hasGps
                      ? 'GPS Active (${state.lastPosition!.latitude.toStringAsFixed(4)}, ${state.lastPosition!.longitude.toStringAsFixed(4)}) • Accuracy ~${state.lastPosition!.accuracy.round()}m'
                      : 'GPS Standby • Device location ready for instant SOS trigger',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: hasGps ? AppColors.midnightNavy : AppColors.slateNeutral,
                  ),
                ),
              ),
            ],
          ),
        ),

        // SOS Button
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SosHoldButton(
              isLoading: state.isLoading,
              onTriggered: () {
                notifier.startEmergency();
              },
            ),
            const SizedBox(height: 24),
            const Text(
              'Tap or hold button to trigger emergency',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.midnightNavy,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Immediately alerts up to 3 emergency contacts with your live tracking link\nand dispatches verified community volunteers nearby.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.slateNeutral,
                height: 1.4,
              ),
            ),
          ],
        ),

        // Emergency Police Call 112
        OutlinedButton.icon(
          onPressed: () => notifier.call112(),
          icon: const Icon(Icons.phone_in_talk, color: AppColors.midnightNavy, size: 20),
          label: const Text(
            'CALL 112 (NATIONAL EMERGENCY)',
            style: TextStyle(
              color: AppColors.midnightNavy,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
              fontSize: 13,
            ),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            side: const BorderSide(color: AppColors.midnightNavy, width: 1.8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            backgroundColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildActiveView(
    BuildContext context,
    EmergencyState state,
    EmergencyController notifier,
  ) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Active SOS Live GPS Card
                ActiveSosCard(state: state),
                const SizedBox(height: 14),

                // Share Live Tracking Link Button
                ElevatedButton.icon(
                  onPressed: () => _shareTrackingLink(context, state.trackingUrl),
                  icon: const Icon(Icons.share, color: Colors.white, size: 18),
                  label: const Text(
                    'SHARE LIVE TRACKING LINK',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandTeal,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 14),

                // Responders Status
                ResponderStatusList(responders: state.responders),
                const SizedBox(height: 18),

                // Official Helpline Notice
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Color(0xFFB45309), size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Community volunteers provide immediate nearby human presence. For armed or critical situations, call official police.',
                          style: TextStyle(fontSize: 12, color: Color(0xFF92400E), height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Action Buttons Row
        Column(
          children: [
            ElevatedButton.icon(
              onPressed: () => notifier.call112(),
              icon: const Icon(Icons.phone, color: Colors.white, size: 20),
              label: const Text(
                'CALL 112 IMMEDIATELY',
                style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.emergencyRed,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => _showCancelDialog(context),
              style: OutlinedButton.styleFrom(
                backgroundColor: AppColors.midnightNavy,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text(
                'CANCEL EMERGENCY ALERT (I AM SAFE)',
                style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: SafeLinkWomenApp()));
}

class SafeLinkWomenApp extends StatelessWidget {
  const SafeLinkWomenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SafeLink Emergency',
      theme: SafeLinkTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const WomenEmergencyMainScreen(),
    );
  }
}

class WomenEmergencyMainScreen extends StatefulWidget {
  const WomenEmergencyMainScreen({super.key});

  @override
  State<WomenEmergencyMainScreen> createState() => _WomenEmergencyMainScreenState();
}

class _WomenEmergencyMainScreenState extends State<WomenEmergencyMainScreen>
    with SingleTickerProviderStateMixin {
  bool _isEmergencyActive = false;
  double _holdProgress = 0.0;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..addListener(() {
        setState(() {
          _holdProgress = _animController.value;
        });
      })..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _triggerEmergency();
        }
      });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _triggerEmergency() {
    setState(() {
      _isEmergencyActive = true;
    });
  }

  void _cancelEmergency() {
    setState(() {
      _isEmergencyActive = false;
      _holdProgress = 0.0;
      _animController.reset();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SafeLink'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: _isEmergencyActive ? _buildActiveEmergencyView() : _buildIdleView(),
        ),
      ),
    );
  }

  Widget _buildIdleView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Top status card
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: const Row(
            children: [
              Icon(Icons.location_on, color: Color(0xFF0F766E), size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'GPS Ready • Emergency background location active on SOS only',
                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                ),
              ),
            ],
          ),
        ),

        // Prominent Emergency Button with 1.5s Hold Ring
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTapDown: (_) => _animController.forward(),
                onTapUp: (_) => _animController.reverse(),
                onTapCancel: () => _animController.reverse(),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Circular progress ring
                    SizedBox(
                      width: 240,
                      height: 240,
                      child: CircularProgressIndicator(
                        value: _holdProgress,
                        strokeWidth: 8,
                        backgroundColor: const Color(0xFFFEE2E2),
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFDC2626)),
                      ),
                    ),
                    // Inner SOS Button
                    Container(
                      width: 210,
                      height: 210,
                      decoration: const BoxDecoration(
                        color: Color(0xFFDC2626),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x33DC2626),
                            blurRadius: 24,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.warning_amber_rounded, size: 48, color: Colors.white),
                          SizedBox(height: 8),
                          Text(
                            'NEED HELP?',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.1,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'HOLD 1.5 SECONDS',
                            style: TextStyle(
                              color: Color(0xFFFEE2E2),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Hold button to notify 3 family contacts\nand verified community responders nearby.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Color(0xFF64748B), height: 1.4),
              ),
            ],
          ),
        ),

        // CALL 112 Button
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.phone_in_talk, color: Color(0xFF0B132B)),
          label: const Text(
            'CALL 112 (OFFICIAL POLICE)',
            style: TextStyle(color: Color(0xFF0B132B), fontWeight: FontWeight.bold),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(50),
            side: const Border.all(color: Color(0xFF0B132B), width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveEmergencyView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFEE2E2),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFDC2626)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.sensors, color: Color(0xFFDC2626)),
                  SizedBox(width: 8),
                  Text(
                    'SOS ACTIVE • STREAMING LIVE LOCATION',
                    style: TextStyle(
                      color: Color(0xFFDC2626),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Text('• 3 Registered Emergency Contacts Notified with Live Link'),
              Text('• 8 Verified Responders Dispatched within 1 km'),
            ],
          ),
        ),

        // Cancel Button
        ElevatedButton(
          onPressed: _cancelEmergency,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0B132B),
            minimumSize: const Size.fromHeight(56),
          ),
          child: const Text('CANCEL EMERGENCY ALERT (I AM SAFE)'),
        ),
      ],
    );
  }
}

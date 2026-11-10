import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_dart/shared_dart.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: SafeLinkVolunteerApp()));
}

class SafeLinkVolunteerApp extends StatelessWidget {
  const SafeLinkVolunteerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SafeLink Volunteer Responder',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(SafeLinkColors.bgWarmLight),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(SafeLinkColors.brandPrimary),
          primary: const Color(SafeLinkColors.brandPrimary),
        ),
      ),
      debugShowCheckedModeBanner: false,
      home: const VolunteerDashboardScreen(),
    );
  }
}

class VolunteerDashboardScreen extends StatefulWidget {
  const VolunteerDashboardScreen({super.key});

  @override
  State<VolunteerDashboardScreen> createState() => _VolunteerDashboardScreenState();
}

class _VolunteerDashboardScreenState extends State<VolunteerDashboardScreen> {
  bool _isAvailable = false;

  void _toggleAvailability(bool val) {
    setState(() {
      _isAvailable = val;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(SafeLinkColors.bgWarmLight),
        title: const Text('SafeLink Volunteer', style: TextStyle(color: Color(SafeLinkColors.textMidnight))),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Availability Toggle Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isAvailable ? 'STATUS: AVAILABLE' : 'STATUS: OFFLINE',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _isAvailable
                                ? const Color(SafeLinkColors.statusSuccess)
                                : const Color(SafeLinkColors.textSecondary),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isAvailable
                              ? 'Broadcasting location to receive alerts'
                              : 'Toggle on when ready to respond',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    Switch(
                      value: _isAvailable,
                      onChanged: _toggleAvailability,
                      activeColor: const Color(SafeLinkColors.brandPrimary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Nearby Incidents',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(SafeLinkColors.textMidnight),
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: Center(
                  child: Text(
                    _isAvailable
                        ? 'No active emergencies nearby within 1 km.'
                        : 'Switch to Available to receive alerts when someone nearby needs help.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

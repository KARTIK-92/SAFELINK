import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_dart/shared_dart.dart';

class SosHoldButton extends StatefulWidget {
  final VoidCallback onTriggered;
  final bool isLoading;

  const SosHoldButton({
    super.key,
    required this.onTriggered,
    this.isLoading = false,
  });

  @override
  State<SosHoldButton> createState() => _SosHoldButtonState();
}

class _SosHoldButtonState extends State<SosHoldButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  double _progress = 0.0;
  bool _isHolding = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )
      ..addListener(() {
        setState(() {
          _progress = _controller.value;
        });
      })
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          HapticFeedback.heavyImpact();
          widget.onTriggered();
          _resetHold();
        }
      });
  }

  void _onHoldStart() {
    if (widget.isLoading) return;
    setState(() => _isHolding = true);
    HapticFeedback.mediumImpact();
    _controller.forward();
  }

  void _resetHold() {
    setState(() => _isHolding = false);
    _controller.reverse();
  }

  void _onDirectTap() {
    if (widget.isLoading) return;
    HapticFeedback.heavyImpact();
    widget.onTriggered();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _onDirectTap,
      onTapDown: (_) => _onHoldStart(),
      onTapUp: (_) => _resetHold(),
      onTapCancel: () => _resetHold(),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer Pulsing Glow while holding
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: _isHolding ? 260 : 230,
            height: _isHolding ? 260 : 230,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.emergencyRed.withOpacity(_isHolding ? 0.25 : 0.08),
            ),
          ),

          // Circular Hold Progress Fill Ring
          SizedBox(
            width: 236,
            height: 236,
            child: CircularProgressIndicator(
              value: _progress,
              strokeWidth: 8,
              backgroundColor: AppColors.emergencyRed.withOpacity(0.15),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.emergencyRed),
            ),
          ),

          // Main Button Core
          Container(
            width: 206,
            height: 206,
            decoration: BoxDecoration(
              color: AppColors.emergencyRed,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.emergencyRed.withOpacity(0.4),
                  blurRadius: _isHolding ? 32 : 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: widget.isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 3,
                    ),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.shield_outlined,
                        size: 46,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'SOS',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isHolding ? 'TRIGGERING...' : 'TAP OR HOLD',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.95),
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_dart/shared_dart.dart';
import 'package:mobile_women/src/features/emergency/emergency_controller.dart';

void main() {
  group('EmergencyState Unit Tests', () {
    test('Default EmergencyState is idle and zero-loaded', () {
      const state = EmergencyState();
      expect(state.isActive, false);
      expect(state.isLoading, false);
      expect(state.incidentId, isNull);
      expect(state.contactsNotified, 0);
      expect(state.volunteersNotified, 0);
      expect(state.responders, isEmpty);
      expect(state.lastPosition, isNull);
    });

    test('EmergencyState copyWith transitions to active correctly', () {
      const state = EmergencyState();
      final active = state.copyWith(
        isActive: true,
        incidentId: 'inc-12345',
        contactsNotified: 2,
        volunteersNotified: 4,
        trackingToken: 'tok-abc',
      );

      expect(active.isActive, true);
      expect(active.incidentId, 'inc-12345');
      expect(active.contactsNotified, 2);
      expect(active.volunteersNotified, 4);
      expect(active.trackingToken, 'tok-abc');
    });

    test('IncidentState parses backend payload faithfully', () {
      final json = {
        'incident_id': '550e8400-e29b-41d4-a716-446655440000',
        'status': 'active',
        'tracking_token': 'test_token_256',
        'tracking_url': 'http://localhost:3000/t/test_token_256',
        'contacts_notified_count': 3,
        'volunteers_notified_count': 6,
        'started_at': '2026-11-10T19:00:00Z',
      };

      final incident = IncidentState.fromJson(json);
      expect(incident.incidentId, '550e8400-e29b-41d4-a716-446655440000');
      expect(incident.status, IncidentStatus.active);
      expect(incident.contactsNotified, 3);
      expect(incident.volunteersNotified, 6);
      expect(incident.trackingToken, 'test_token_256');
    });
  });
}

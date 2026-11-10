import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_volunteer/src/features/dashboard/volunteer_controller.dart';

void main() {
  group('VolunteerState Unit Tests', () {
    test('Default VolunteerState is offline with zero candidate incidents', () {
      const state = VolunteerState();
      expect(state.isAvailable, false);
      expect(state.isLoading, false);
      expect(state.profile, isNull);
      expect(state.candidateIncidents, isEmpty);
      expect(state.activeIncident, isNull);
    });

    test('VolunteerState copyWith switches availability and stores candidate alert', () {
      const state = VolunteerState();
      final updated = state.copyWith(
        isAvailable: true,
        candidateIncidents: [
          {
            'incident_id': 'inc-999',
            'approximate_distance_meters': 320,
            'address_hint': 'Near MG Road Station',
          }
        ],
      );

      expect(updated.isAvailable, true);
      expect(updated.candidateIncidents.length, 1);
      expect(updated.candidateIncidents.first['incident_id'], 'inc-999');
      expect(updated.candidateIncidents.first['approximate_distance_meters'], 320);
    });

    test('VolunteerState active incident holds unlocked coordinates', () {
      const state = VolunteerState();
      final withActive = state.copyWith(
        activeIncident: {
          'incident_id': 'inc-999',
          'victim_display_name': 'Priya S.',
          'latitude': 12.9716,
          'longitude': 77.5946,
          'response_status': 'accepted',
        },
      );

      expect(withActive.activeIncident, isNotNull);
      expect(withActive.activeIncident!['victim_display_name'], 'Priya S.');
      expect(withActive.activeIncident!['latitude'], 12.9716);
      expect(withActive.activeIncident!['response_status'], 'accepted');
    });
  });
}

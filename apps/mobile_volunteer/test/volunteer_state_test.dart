import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_volunteer/src/features/dashboard/volunteer_controller.dart';

void main() {
  group('VolunteerState Unit Tests', () {
    test('Default VolunteerState is always available with zero candidate incidents', () {
      const state = VolunteerState();
      expect(state.isAvailable, true);
      expect(state.isLoading, false);
      expect(state.profile, isNull);
      expect(state.candidateIncidents, isEmpty);
      expect(state.activeIncident, isNull);
    });

    test('VolunteerState copyWith stores candidate alert and preserves active incident', () {
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

      // Subsequent copyWith updating candidateIncidents must NOT wipe activeIncident!
      final updatedCandidates = withActive.copyWith(
        candidateIncidents: [
          {
            'incident_id': 'inc-1000',
            'approximate_distance_meters': 320,
            'address_hint': 'Near MG Road Station',
          }
        ],
      );

      expect(updatedCandidates.activeIncident, isNotNull);
      expect(updatedCandidates.activeIncident!['incident_id'], 'inc-999');
      expect(updatedCandidates.candidateIncidents.length, 1);

      // Explicit clearActiveIncident clears it
      final cleared = updatedCandidates.copyWith(clearActiveIncident: true);
      expect(cleared.activeIncident, isNull);
    });
  });
}

enum IncidentStatus { active, resolved, cancelled, expired }

enum VolunteerIncidentStatus {
  alertReceived,
  accepted,
  onTheWay,
  reachedLocation,
  assistanceCompleted,
  unableToAssist,
  cancelled,
}

class IncidentState {
  final String incidentId;
  final IncidentStatus status;
  final String trackingToken;
  final String trackingUrl;
  final int contactsNotified;
  final int volunteersNotified;
  final DateTime startedAt;

  const IncidentState({
    required this.incidentId,
    required this.status,
    required this.trackingToken,
    required this.trackingUrl,
    required this.contactsNotified,
    required this.volunteersNotified,
    required this.startedAt,
  });

  factory IncidentState.fromJson(Map<String, dynamic> json) {
    return IncidentState(
      incidentId: json['incident_id'] as String,
      status: _parseStatus(json['status'] as String?),
      trackingToken: json['tracking_token'] as String? ?? '',
      trackingUrl: json['tracking_url'] as String? ?? '',
      contactsNotified: json['contacts_notified_count'] as int? ?? 0,
      volunteersNotified: json['volunteers_notified_count'] as int? ?? 0,
      startedAt: DateTime.tryParse(json['started_at'] as String? ?? '') ?? DateTime.now(),
    );
  }

  static IncidentStatus _parseStatus(String? status) {
    switch (status) {
      case 'resolved':
        return IncidentStatus.resolved;
      case 'cancelled':
        return IncidentStatus.cancelled;
      case 'expired':
        return IncidentStatus.expired;
      default:
        return IncidentStatus.active;
    }
  }
}

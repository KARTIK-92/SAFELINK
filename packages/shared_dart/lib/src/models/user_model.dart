enum UserRole { woman, volunteer, admin }

enum AccountStatus { pending, verified, rejected, suspended, underReview }

class SafeLinkUser {
  final String id;
  final String phone;
  final String email;
  final UserRole role;
  final AccountStatus status;
  final String? fullName;

  const SafeLinkUser({
    required this.id,
    required this.phone,
    required this.email,
    required this.role,
    required this.status,
    this.fullName,
  });

  factory SafeLinkUser.fromJson(Map<String, dynamic> json) {
    return SafeLinkUser(
      id: json['id'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String,
      role: _parseRole(json['role'] as String?),
      status: _parseStatus(json['status'] as String?),
      fullName: json['full_legal_name'] as String? ?? json['profile']?['full_legal_name'] as String?,
    );
  }

  static UserRole _parseRole(String? role) {
    switch (role) {
      case 'volunteer':
        return UserRole.volunteer;
      case 'admin':
        return UserRole.admin;
      default:
        return UserRole.woman;
    }
  }

  static AccountStatus _parseStatus(String? status) {
    switch (status) {
      case 'verified':
        return AccountStatus.verified;
      case 'rejected':
        return AccountStatus.rejected;
      case 'suspended':
        return AccountStatus.suspended;
      case 'under_review':
        return AccountStatus.underReview;
      default:
        return AccountStatus.pending;
    }
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'phone': phone,
    'email': email,
    'role': role.name,
    'status': status.name,
    'full_legal_name': fullName,
  };
}

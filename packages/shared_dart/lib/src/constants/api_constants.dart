/// API Constants & Endpoints Configuration

class ApiConstants {
  static const String defaultBaseUrl = 'https://safelink-api-zuiu.onrender.com/api/v1';
  static const String brandName = 'SafeLink';
  static const String emergencyNumber = '112';

  // Auth
  static const String endpointLogin = '/auth/login';
  static const String endpointRegister = '/auth/register';
  static const String endpointOtpSend = '/auth/otp/send';
  static const String endpointOtpVerify = '/auth/otp/verify';
  static const String endpointRefresh = '/auth/refresh';
  static const String endpointLogout = '/auth/logout';

  // SOS
  static const String endpointSosStart = '/sos/start';
  static const String endpointSosLocation = '/sos/location';
  static const String endpointSosCancel = '/sos/cancel';
  static const String endpointSosStatus = '/sos';

  // Volunteer
  static const String endpointVolunteerAvailability = '/volunteer/availability';
  static const String endpointVolunteerLocation = '/volunteer/location';
  static const String endpointVolunteerIncidents = '/volunteer/incidents';
}

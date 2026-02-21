/// Configuration de l'API ScanGRID
class ApiConfig {
  ApiConfig._();

  /// URL de base du serveur Raspberry Pi
  /// À modifier selon votre réseau local
  static const String baseUrl = 'http://MacBook-Pro-de-Mathis.local:8001';

  /// Timeout pour les requêtes réseau (en secondes)
  static const int connectionTimeout = 30;
  static const int receiveTimeout = 30;

  /// Endpoints
  static const String healthEndpoint = '/';
  static const String drawersEndpoint = '/drawers';
  static const String binsEndpoint = '/bins';

  /// Headers par défaut
  static const Map<String, String> headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

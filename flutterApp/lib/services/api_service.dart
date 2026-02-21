import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import '../core/config/api_config.dart';
import '../models/drawer.dart';
import '../models/bin.dart';

/// Service pour interagir avec l'API ScanGRID
class ApiService {
  final Dio _dio;
  final Logger _logger = Logger();

  ApiService()
    : _dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: Duration(seconds: ApiConfig.connectionTimeout),
          receiveTimeout: Duration(seconds: ApiConfig.receiveTimeout),
          headers: ApiConfig.headers,
        ),
      ) {
    // Intercepteur pour logger les requêtes
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => _logger.d(obj),
      ),
    );
  }

  // ==================== HEALTH CHECK ====================

  /// Vérifier si le serveur est accessible
  Future<bool> checkHealth() async {
    try {
      final response = await _dio.get(ApiConfig.healthEndpoint);
      return response.statusCode == 200;
    } on DioException catch (e) {
      _logger.e('Health check failed: ${e.message}');
      return false;
    }
  }

  // ==================== DRAWERS ====================

  /// Créer un tiroir complet
  /// Opération transactionnelle : tout ou rien
  Future<Drawer> createDrawer(DrawerCreateRequest request) async {
    try {
      _logger.i('Creating drawer: ${request.name}');

      final response = await _dio.post(
        ApiConfig.drawersEndpoint,
        data: request.toJson(),
      );

      if (response.statusCode == 201) {
        _logger.i('Drawer created successfully');
        return Drawer.fromJson(response.data);
      } else {
        throw ApiException(
          'Unexpected status code: ${response.statusCode}',
          response.statusCode,
        );
      }
    } on DioException catch (e) {
      _logger.e('Failed to create drawer: ${e.message}');
      throw _handleDioException(e);
    }
  }

  /// Récupérer un tiroir par ID
  Future<Drawer> getDrawer(String drawerId) async {
    try {
      _logger.i('Fetching drawer: $drawerId');

      final response = await _dio.get('${ApiConfig.drawersEndpoint}/$drawerId');

      if (response.statusCode == 200) {
        return Drawer.fromJson(response.data);
      } else {
        throw ApiException(
          'Unexpected status code: ${response.statusCode}',
          response.statusCode,
        );
      }
    } on DioException catch (e) {
      _logger.e('Failed to fetch drawer: ${e.message}');
      throw _handleDioException(e);
    }
  }

  /// Lister tous les tiroirs
  Future<List<Drawer>> listDrawers() async {
    try {
      _logger.i('Fetching all drawers');

      final response = await _dio.get(ApiConfig.drawersEndpoint);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Drawer.fromJson(json)).toList();
      } else {
        throw ApiException(
          'Unexpected status code: ${response.statusCode}',
          response.statusCode,
        );
      }
    } on DioException catch (e) {
      _logger.e('Failed to fetch drawers: ${e.message}');
      throw _handleDioException(e);
    }
  }

  /// Supprimer un tiroir (cascade: supprime layers et bins)
  Future<void> deleteDrawer(String drawerId) async {
    try {
      _logger.i('Deleting drawer: $drawerId');

      final response = await _dio.delete(
        '${ApiConfig.drawersEndpoint}/$drawerId',
      );

      if (response.statusCode != 200) {
        throw ApiException(
          'Unexpected status code: ${response.statusCode}',
          response.statusCode,
        );
      }

      _logger.i('Drawer deleted successfully');
    } on DioException catch (e) {
      _logger.e('Failed to delete drawer: ${e.message}');
      throw _handleDioException(e);
    }
  }

  // ==================== BINS ====================

  /// Récupérer une boîte par ID
  Future<Bin> getBin(String binId) async {
    try {
      _logger.i('Fetching bin: $binId');

      final response = await _dio.get('${ApiConfig.binsEndpoint}/$binId');

      if (response.statusCode == 200) {
        return Bin.fromJson(response.data);
      } else {
        throw ApiException(
          'Unexpected status code: ${response.statusCode}',
          response.statusCode,
        );
      }
    } on DioException catch (e) {
      _logger.e('Failed to fetch bin: ${e.message}');
      throw _handleDioException(e);
    }
  }

  /// Mettre à jour une boîte
  Future<Bin> updateBin(String binId, BinUpdateRequest request) async {
    try {
      _logger.i('Updating bin: $binId');

      final response = await _dio.patch(
        '${ApiConfig.binsEndpoint}/$binId',
        data: request.toJson(),
      );

      if (response.statusCode == 200) {
        _logger.i('Bin updated successfully');
        return Bin.fromJson(response.data);
      } else {
        throw ApiException(
          'Unexpected status code: ${response.statusCode}',
          response.statusCode,
        );
      }
    } on DioException catch (e) {
      _logger.e('Failed to update bin: ${e.message}');
      throw _handleDioException(e);
    }
  }

  // ==================== ERROR HANDLING ====================

  ApiException _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          'Timeout: Le serveur ne répond pas. Vérifiez votre connexion au Raspberry Pi.',
          null,
        );

      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data?['detail'] ?? 'Erreur serveur';

        switch (statusCode) {
          case 404:
            return ApiException('Ressource non trouvée', statusCode);
          case 422:
            return ApiException('Erreur de validation: $message', statusCode);
          case 500:
            return ApiException('Erreur serveur: $message', statusCode);
          default:
            return ApiException(
              'Erreur HTTP $statusCode: $message',
              statusCode,
            );
        }

      case DioExceptionType.connectionError:
        return ApiException(
          'Impossible de se connecter au serveur. Vérifiez que le Raspberry Pi est accessible sur le réseau.',
          null,
        );

      default:
        return ApiException('Erreur réseau: ${e.message}', null);
    }
  }
}

/// Exception personnalisée pour les erreurs API
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() =>
      'ApiException: $message${statusCode != null ? ' (HTTP $statusCode)' : ''}';
}

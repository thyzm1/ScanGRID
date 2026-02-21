import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/ocr_service.dart';
import '../services/grid_detection_service.dart';
import '../services/layer_comparison_service.dart';

// ==================== SERVICES ====================

/// Provider pour ApiService (singleton)
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

/// Provider pour OcrService (singleton)
final ocrServiceProvider = Provider<OcrService>((ref) {
  final service = OcrService();

  // Cleanup lors de la suppression du provider
  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// Provider pour GridDetectionService
final gridDetectionServiceProvider = Provider<GridDetectionService>((ref) {
  final ocrService = ref.watch(ocrServiceProvider);
  return GridDetectionService(ocrService);
});

/// Provider pour LayerComparisonService
final layerComparisonServiceProvider = Provider<LayerComparisonService>((ref) {
  return LayerComparisonService();
});

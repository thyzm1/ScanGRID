import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import '../models/bin.dart';
import '../models/detected_bin.dart';
import '../models/layer.dart';
import '../services/grid_detection_service.dart';
import '../services/layer_comparison_service.dart';
import 'service_providers.dart';

// ==================== STATE ====================

/// État pour le scan en cours
class ScanState {
  final List<DetectedBin> detectedBins;
  final List<Layer> previousLayers; // Couches déjà scannées
  final int currentZIndex; // Index de la couche en cours de scan
  final bool isScanning;
  final String? errorMessage;
  final GridDetectionResult? lastDetectionResult;

  ScanState({
    this.detectedBins = const [],
    this.previousLayers = const [],
    this.currentZIndex = 0,
    this.isScanning = false,
    this.errorMessage,
    this.lastDetectionResult,
  });

  ScanState copyWith({
    List<DetectedBin>? detectedBins,
    List<Layer>? previousLayers,
    int? currentZIndex,
    bool? isScanning,
    String? errorMessage,
    GridDetectionResult? lastDetectionResult,
  }) {
    return ScanState(
      detectedBins: detectedBins ?? this.detectedBins,
      previousLayers: previousLayers ?? this.previousLayers,
      currentZIndex: currentZIndex ?? this.currentZIndex,
      isScanning: isScanning ?? this.isScanning,
      errorMessage: errorMessage,
      lastDetectionResult: lastDetectionResult ?? this.lastDetectionResult,
    );
  }

  /// Obtenir la couche précédente (N-1) si elle existe
  Layer? get previousLayer {
    if (currentZIndex == 0 || previousLayers.isEmpty) return null;

    // Chercher la couche avec z_index = currentZIndex - 1
    try {
      return previousLayers.firstWhere(
        (layer) => layer.zIndex == currentZIndex - 1,
      );
    } catch (_) {
      return null;
    }
  }
}

// ==================== NOTIFIER ====================

/// Notifier pour gérer le processus de scan
class ScanNotifier extends StateNotifier<ScanState> {
  final GridDetectionService _gridDetectionService;
  final LayerComparisonService _layerComparisonService;

  ScanNotifier(this._gridDetectionService, this._layerComparisonService)
      : super(ScanState());

  /// Démarrer un nouveau scan (réinitialiser l'état)
  void startNewScan() {
    state = ScanState();
  }

  /// Scanner une image
  Future<void> scanImage(String imagePath) async {
    state = state.copyWith(isScanning: true, errorMessage: null);

    try {
      // 1. Détecter la grille et les boîtes
      final detectionResult = await _gridDetectionService.detectGrid(
        imagePath: imagePath,
      );

      // 2. Filtrer les "trous" en comparant avec la couche précédente
      final filteredBins = _layerComparisonService.filterHoles(
        detectedBins: detectionResult.bins,
        previousLayer: state.previousLayer,
      );

      // 3. Valider qu'il n'y a pas de chevauchements
      final validationErrors = _layerComparisonService.validateLayer(
        filteredBins,
      );

      if (validationErrors.isNotEmpty) {
        state = state.copyWith(
          isScanning: false,
          errorMessage: 'Erreurs de validation: ${validationErrors.join(', ')}',
        );
        return;
      }

      // 4. Mettre à jour l'état
      state = state.copyWith(
        detectedBins: filteredBins,
        isScanning: false,
        lastDetectionResult: detectionResult,
      );
    } catch (e) {
      state = state.copyWith(
        isScanning: false,
        errorMessage: 'Erreur lors du scan: $e',
      );
    }
  }

  /// Passer à la couche suivante
  /// Enregistre la couche actuelle dans previousLayers et incrémente currentZIndex
  void moveToNextLayer() {
    if (state.detectedBins.isEmpty) return;

    // Convertir les DetectedBin en Bin
    final List<Bin> bins = state.detectedBins.map((detectedBin) {
      return Bin(
        xGrid: detectedBin.xGrid,
        yGrid: detectedBin.yGrid,
        widthUnits: detectedBin.widthUnits,
        depthUnits: detectedBin.depthUnits,
        labelText: detectedBin.labelText,
      );
    }).toList();

    // Créer la nouvelle couche
    final newLayer = Layer(zIndex: state.currentZIndex, bins: bins);

    // Mettre à jour l'état
    state = state.copyWith(
      previousLayers: [...state.previousLayers, newLayer],
      currentZIndex: state.currentZIndex + 1,
      detectedBins: [], // Réinitialiser pour la prochaine couche
    );
  }

  /// Modifier une boîte détectée
  void updateDetectedBin(int index, DetectedBin updatedBin) {
    if (index < 0 || index >= state.detectedBins.length) return;

    final updatedList = List<DetectedBin>.from(state.detectedBins);
    updatedList[index] = updatedBin;

    state = state.copyWith(detectedBins: updatedList);
  }

  /// Supprimer une boîte détectée
  void removeDetectedBin(int index) {
    if (index < 0 || index >= state.detectedBins.length) return;

    final updatedList = List<DetectedBin>.from(state.detectedBins);
    updatedList.removeAt(index);

    state = state.copyWith(detectedBins: updatedList);
  }

  /// Ajouter une boîte manuellement
  void addDetectedBin(DetectedBin bin) {
    state = state.copyWith(detectedBins: [...state.detectedBins, bin]);
  }
}

// ==================== PROVIDERS ====================

/// Provider pour le scan
final scanProvider = StateNotifierProvider<ScanNotifier, ScanState>((ref) {
  final gridDetectionService = ref.watch(gridDetectionServiceProvider);
  final layerComparisonService = ref.watch(layerComparisonServiceProvider);

  return ScanNotifier(gridDetectionService, layerComparisonService);
});

/// Provider pour les caméras disponibles
final camerasProvider = FutureProvider<List<CameraDescription>>((ref) async {
  return await availableCameras();
});

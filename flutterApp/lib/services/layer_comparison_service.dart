import 'package:logger/logger.dart';
import '../models/detected_bin.dart';
import '../models/layer.dart';
import '../models/bin.dart';
import '../core/constants/gridfinity_constants.dart';

/// Service pour comparer les couches et détecter les "trous"
///
/// Logique: Si une boîte détectée sur la couche N a exactement le même
/// texte OCR qu'une boîte à la même position (x, y) sur la couche N-1,
/// alors c'est un "trou" laissant voir la couche inférieure.
class LayerComparisonService {
  final Logger _logger = Logger();

  /// Comparer une liste de boîtes détectées avec la couche précédente
  ///
  /// Paramètres:
  /// - [detectedBins]: Boîtes détectées sur la couche courante
  /// - [previousLayer]: Couche précédente (N-1), peut être null si c'est la première
  ///
  /// Retourne la liste des boîtes RÉELLES (sans les trous)
  List<DetectedBin> filterHoles({
    required List<DetectedBin> detectedBins,
    Layer? previousLayer,
  }) {
    // Si pas de couche précédente, toutes les boîtes sont réelles
    if (previousLayer == null) {
      _logger.i('No previous layer, keeping all ${detectedBins.length} bins');
      return detectedBins;
    }

    _logger.i(
      'Comparing ${detectedBins.length} detected bins with previous layer (z=${previousLayer.zIndex})',
    );

    final realBins = <DetectedBin>[];
    int holesDetected = 0;

    for (final detectedBin in detectedBins) {
      // Chercher une boîte à la même position dans la couche précédente
      final underlyingBin = _findBinAtPosition(
        previousLayer,
        detectedBin.xGrid,
        detectedBin.yGrid,
      );

      if (underlyingBin != null) {
        // Comparer les textes
        final isSameText = _compareTexts(
          detectedBin.labelText,
          underlyingBin.labelText,
        );

        if (isSameText) {
          // C'est un trou !
          _logger.d(
            'Hole detected at (${detectedBin.xGrid}, ${detectedBin.yGrid}): "${detectedBin.labelText}"',
          );

          holesDetected++;

          // Marquer comme trou mais l'ajouter quand même pour statistiques
          realBins.add(
            detectedBin.copyWith(
              isHole: true,
              underlyingBinText: underlyingBin.labelText,
            ),
          );
          continue;
        }
      }

      // Boîte réelle
      realBins.add(detectedBin);
    }

    // Filtrer les trous si demandé
    final withoutHoles = realBins.where((bin) => !bin.isHole).toList();

    _logger.i(
      'Detected $holesDetected holes. Real bins: ${withoutHoles.length}',
    );

    return withoutHoles;
  }

  /// Trouver une boîte à une position donnée dans une couche
  Bin? _findBinAtPosition(Layer layer, int xGrid, int yGrid) {
    for (final bin in layer.bins) {
      // Vérifier si la position (x, y) est à l'intérieur de cette boîte
      if (xGrid >= bin.xGrid &&
          xGrid < bin.xGrid + bin.widthUnits &&
          yGrid >= bin.yGrid &&
          yGrid < bin.yGrid + bin.depthUnits) {
        return bin;
      }
    }
    return null;
  }

  /// Comparer deux textes OCR avec tolérance
  ///
  /// Stratégie:
  /// - Normaliser les textes (trim, lowercase)
  /// - Comparer strictement
  /// - Si l'un est vide, pas de match
  bool _compareTexts(String? text1, String? text2) {
    if (text1 == null || text2 == null) return false;
    if (text1.isEmpty || text2.isEmpty) return false;

    final normalized1 = _normalizeText(text1);
    final normalized2 = _normalizeText(text2);

    // Comparaison stricte
    final exactMatch = normalized1 == normalized2;

    if (exactMatch) {
      _logger.d('Exact text match: "$normalized1" == "$normalized2"');
    }

    return exactMatch;
  }

  /// Normaliser un texte pour la comparaison
  String _normalizeText(String text) {
    return text.trim().toLowerCase().replaceAll(
          RegExp(r'\s+'),
          ' ',
        ); // Normaliser les espaces
  }

  /// Valider qu'une couche n'a pas de chevauchements de boîtes
  ///
  /// Retourne une liste des erreurs de chevauchement détectées
  List<String> validateLayer(List<DetectedBin> bins) {
    final errors = <String>[];

    for (int i = 0; i < bins.length; i++) {
      for (int j = i + 1; j < bins.length; j++) {
        if (_binsOverlap(bins[i], bins[j])) {
          errors.add(
            'Chevauchement détecté entre boîte (${bins[i].xGrid},${bins[i].yGrid}) '
            'et boîte (${bins[j].xGrid},${bins[j].yGrid})',
          );
        }
      }
    }

    if (errors.isNotEmpty) {
      _logger.w('Layer validation found ${errors.length} overlap(s)');
    }

    return errors;
  }

  /// Vérifier si deux boîtes se chevauchent
  bool _binsOverlap(DetectedBin bin1, DetectedBin bin2) {
    // Rectangle 1
    final x1Min = bin1.xGrid;
    final x1Max = bin1.xGrid + bin1.widthUnits;
    final y1Min = bin1.yGrid;
    final y1Max = bin1.yGrid + bin1.depthUnits;

    // Rectangle 2
    final x2Min = bin2.xGrid;
    final x2Max = bin2.xGrid + bin2.widthUnits;
    final y2Min = bin2.yGrid;
    final y2Max = bin2.yGrid + bin2.depthUnits;

    // Pas de chevauchement si:
    // - rect1 est complètement à gauche de rect2
    // - rect1 est complètement à droite de rect2
    // - rect1 est complètement au-dessus de rect2
    // - rect1 est complètement en-dessous de rect2
    if (x1Max <= x2Min || x2Max <= x1Min || y1Max <= y2Min || y2Max <= y1Min) {
      return false;
    }

    return true; // Chevauchement détecté
  }
}

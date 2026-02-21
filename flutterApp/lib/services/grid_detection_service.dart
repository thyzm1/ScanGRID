import 'dart:io';
import 'dart:math' as math;
import 'package:image/image.dart' as img;
import 'package:logger/logger.dart';
import '../core/constants/gridfinity_constants.dart';
import '../models/detected_bin.dart';
import 'ocr_service.dart';

/// Service pour détecter la grille Gridfinity dans une image
///
/// Algorithme:
/// 1. Détection des contours/rectangles dans l'image
/// 2. Calcul du ratio pixels/unité Gridfinity
/// 3. Conversion des rectangles détectés en coordonnées grille
/// 4. OCR sur chaque boîte détectée
class GridDetectionService {
  final OcrService _ocrService;
  final Logger _logger = Logger();

  GridDetectionService(this._ocrService);

  /// Analyser une image pour détecter les boîtes Gridfinity
  ///
  /// Retourne une liste de boîtes détectées avec leurs coordonnées
  /// et le texte OCR associé
  Future<GridDetectionResult> detectGrid({required String imagePath}) async {
    try {
      _logger.i('Starting grid detection on: $imagePath');

      // 1. Charger l'image
      final bytes = await File(imagePath).readAsBytes();
      final image = img.decodeImage(bytes);

      if (image == null) {
        throw Exception('Failed to decode image');
      }

      _logger.d('Image size: ${image.width}x${image.height}');

      // 2. Prétraitement de l'image
      final processed = _preprocessImage(image);

      // 3. Détection des contours/rectangles
      final rectangles = _detectRectangles(processed);

      _logger.i('Detected ${rectangles.length} rectangles');

      if (rectangles.isEmpty) {
        return GridDetectionResult(
          bins: [],
          imageWidth: image.width,
          imageHeight: image.height,
          gridUnitSize: 0,
        );
      }

      // 4. Calculer le ratio pixels par unité Gridfinity
      final gridUnitSize = _calculateGridUnitSize(rectangles);

      _logger.i(
        'Estimated grid unit size: ${gridUnitSize.toStringAsFixed(2)} pixels',
      );

      // 5. Convertir les rectangles en coordonnées Gridfinity
      final detectedBins = <DetectedBin>[];

      for (final rect in rectangles) {
        final bin = _convertRectangleToBin(rect, gridUnitSize);

        // 6. OCR sur cette région
        final ocrResult = await _ocrService.extractTextFromRegion(
          imagePath: imagePath,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        );

        detectedBins.add(
          bin.copyWith(
            labelText: ocrResult.text.isNotEmpty ? ocrResult.text : null,
            ocrConfidence: ocrResult.confidence,
          ),
        );
      }

      _logger.i('Successfully detected ${detectedBins.length} bins');

      return GridDetectionResult(
        bins: detectedBins,
        imageWidth: image.width,
        imageHeight: image.height,
        gridUnitSize: gridUnitSize.toInt(),
      );
    } catch (e, stackTrace) {
      _logger.e('Grid detection failed', error: e, stackTrace: stackTrace);
      rethrow;
    }
  }

  /// Prétraiter l'image pour améliorer la détection
  ///
  /// Transformations:
  /// - Conversion en niveaux de gris
  /// - Augmentation du contraste
  /// - Détection des contours (sobel)
  img.Image _preprocessImage(img.Image image) {
    _logger.d('Preprocessing image...');

    // Convertir en niveaux de gris
    var processed = img.grayscale(image);

    // Augmenter le contraste pour faire ressortir les boîtes
    processed = img.adjustColor(processed, contrast: 1.5);

    // Appliquer un filtre gaussien pour réduire le bruit
    processed = img.gaussianBlur(processed, radius: 2);

    return processed;
  }

  /// Détecter les rectangles dans l'image prétraitée
  ///
  /// Algorithme simplifié basé sur l'analyse des contours:
  /// 1. Détection de contours (Sobel)
  /// 2. Seuillage
  /// 3. Groupement en rectangles candidats
  ///
  /// Note: Pour une détection plus robuste, utiliser opencv_dart
  List<DetectedRectangle> _detectRectangles(img.Image image) {
    _logger.d('Detecting rectangles...');

    // Appliquer un seuillage pour obtenir une image binaire
    final threshold = _calculateOtsuThreshold(image);
    final binary = _applyThreshold(image, threshold);

    // Analyser l'image pour trouver des régions connexes
    final rectangles = _findConnectedComponents(binary);

    // Filtrer les rectangles trop petits
    final filtered = rectangles.where((rect) {
      return rect.width >= GridfinityConstants.minBinSizePixels &&
          rect.height >= GridfinityConstants.minBinSizePixels;
    }).toList();

    _logger.d('Found ${filtered.length} valid rectangles after filtering');

    return filtered;
  }

  /// Calculer le seuil optimal (méthode d'Otsu simplifiée)
  int _calculateOtsuThreshold(img.Image image) {
    // Calculer l'histogramme
    final histogram = List<int>.filled(256, 0);

    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final gray = pixel.r.toInt(); // Image déjà en niveaux de gris
        histogram[gray]++;
      }
    }

    // Otsu simplifié: retourner la valeur médiane
    int total = image.width * image.height;
    int sum = 0;
    int i = 0;

    while (sum < total / 2 && i < 256) {
      sum += histogram[i];
      i++;
    }

    return i.clamp(
      100,
      180,
    ); // Valeurs raisonnables pour du papier/plastique blanc
  }

  /// Appliquer un seuillage
  img.Image _applyThreshold(img.Image image, int threshold) {
    final result = img.Image(width: image.width, height: image.height);

    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final gray = pixel.r.toInt();

        // Blanc si au-dessus du seuil, noir sinon
        final value = gray > threshold ? 255 : 0;
        result.setPixelRgba(x, y, value, value, value, 255);
      }
    }

    return result;
  }

  /// Trouver les composantes connexes (rectangles)
  ///
  /// Algorithme simplifié: scan l'image et groupe les pixels blancs adjacents
  List<DetectedRectangle> _findConnectedComponents(img.Image binary) {
    final visited = List.generate(
      binary.height,
      (_) => List<bool>.filled(binary.width, false),
    );

    final rectangles = <DetectedRectangle>[];

    for (int y = 0; y < binary.height; y++) {
      for (int x = 0; x < binary.width; x++) {
        final pixel = binary.getPixel(x, y);

        if (pixel.r >= 128 && !visited[y][x]) {
          // Trouver les limites de cette composante
          final bounds = _floodFill(binary, visited, x, y);

          if (bounds != null) {
            rectangles.add(bounds);
          }
        }
      }
    }

    return rectangles;
  }

  /// Flood fill pour trouver les limites d'une composante
  DetectedRectangle? _floodFill(
    img.Image binary,
    List<List<bool>> visited,
    int startX,
    int startY,
  ) {
    int minX = startX, maxX = startX;
    int minY = startY, maxY = startY;

    final stack = <(int, int)>[(startX, startY)];
    int pixelCount = 0;

    while (stack.isNotEmpty) {
      final (x, y) = stack.removeLast();

      if (x < 0 || x >= binary.width || y < 0 || y >= binary.height) continue;
      if (visited[y][x]) continue;

      final pixel = binary.getPixel(x, y);
      if (pixel.r < 128) continue;

      visited[y][x] = true;
      pixelCount++;

      minX = math.min(minX, x);
      maxX = math.max(maxX, x);
      minY = math.min(minY, y);
      maxY = math.max(maxY, y);

      // Explorer les voisins (4-connectivité)
      stack.add((x + 1, y));
      stack.add((x - 1, y));
      stack.add((x, y + 1));
      stack.add((x, y - 1));
    }

    // Filtrer si trop petit
    final width = maxX - minX + 1;
    final height = maxY - minY + 1;

    if (pixelCount < 100) return null; // Trop petit, probablement du bruit

    return DetectedRectangle(
      x: minX.toDouble(),
      y: minY.toDouble(),
      width: width.toDouble(),
      height: height.toDouble(),
    );
  }

  /// Calculer la taille d'une unité Gridfinity en pixels
  ///
  /// Stratégie:
  /// 1. Trouver le rectangle le plus petit (probablement 1x1)
  /// 2. Utiliser sa taille comme référence
  /// 3. Valider avec les autres rectangles
  double _calculateGridUnitSize(List<DetectedRectangle> rectangles) {
    if (rectangles.isEmpty) return 0.0;

    // Trouver les dimensions minimales
    double minDimension = double.infinity;

    for (final rect in rectangles) {
      final smallerDim = math.min(rect.width, rect.height);
      if (smallerDim < minDimension) {
        minDimension = smallerDim;
      }
    }

    // La plus petite dimension correspond probablement à 1 unité Gridfinity
    return minDimension;
  }

  /// Convertir un rectangle en DetectedBin avec coordonnées Gridfinity
  DetectedBin _convertRectangleToBin(
    DetectedRectangle rect,
    double gridUnitSize,
  ) {
    // Coordonnées de la grille (arrondir à l'unité la plus proche)
    final xGrid = (rect.x / gridUnitSize).round();
    final yGrid = (rect.y / gridUnitSize).round();

    // Dimensions en unités Gridfinity
    final widthUnits = (rect.width / gridUnitSize).round().clamp(1, 10);
    final depthUnits = (rect.height / gridUnitSize).round().clamp(1, 10);

    return DetectedBin(
      xGrid: xGrid,
      yGrid: yGrid,
      widthUnits: widthUnits,
      depthUnits: depthUnits,
      pixelX: rect.x,
      pixelY: rect.y,
      pixelWidth: rect.width,
      pixelHeight: rect.height,
    );
  }
}

/// Rectangle détecté dans l'image
class DetectedRectangle {
  final double x;
  final double y;
  final double width;
  final double height;

  DetectedRectangle({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });

  @override
  String toString() => 'Rectangle($x, $y, $width x $height)';
}

/// Résultat de la détection de grille
class GridDetectionResult {
  final List<DetectedBin> bins;
  final int imageWidth;
  final int imageHeight;
  final int gridUnitSize; // Taille d'une unité en pixels

  GridDetectionResult({
    required this.bins,
    required this.imageWidth,
    required this.imageHeight,
    required this.gridUnitSize,
  });
}

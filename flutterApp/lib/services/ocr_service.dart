import 'dart:io';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image/image.dart' as img;
import 'package:logger/logger.dart';

/// Service pour l'OCR (Optical Character Recognition) sur les images
class OcrService {
  final TextRecognizer _textRecognizer;
  final Logger _logger = Logger();

  OcrService() : _textRecognizer = TextRecognizer();

  /// Extraire le texte d'une région spécifique d'une image
  ///
  /// Paramètres:
  /// - [imagePath]: Chemin vers l'image source
  /// - [x, y, width, height]: Coordonnées de la région en pixels
  ///
  /// Retourne le texte détecté et la confiance
  Future<OcrResult> extractTextFromRegion({
    required String imagePath,
    required double x,
    required double y,
    required double width,
    required double height,
  }) async {
    try {
      _logger.d('OCR on region: ($x, $y, $width, $height)');

      // Charger et cropper l'image
      final croppedImagePath = await _cropImage(
        imagePath,
        x.toInt(),
        y.toInt(),
        width.toInt(),
        height.toInt(),
      );

      // Reconnaissance de texte
      final inputImage = InputImage.fromFilePath(croppedImagePath);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      // Nettoyage
      await File(croppedImagePath).delete();

      // Extraire le texte et calculer la confiance moyenne
      if (recognizedText.blocks.isEmpty) {
        _logger.d('No text detected in region');
        return OcrResult(text: '', confidence: 0.0);
      }

      final allText = recognizedText.text.trim();

      // Calculer la confiance moyenne (ML Kit ne fournit pas directement la conf)
      // On utilise le nombre de lignes détectées comme proxy
      final confidence = _calculateConfidence(recognizedText);

      _logger.d(
        'OCR result: "$allText" (confidence: ${confidence.toStringAsFixed(2)})',
      );

      return OcrResult(text: allText, confidence: confidence);
    } catch (e) {
      _logger.e('OCR error: $e');
      return OcrResult(text: '', confidence: 0.0);
    }
  }

  /// Cropper une région d'une image
  Future<String> _cropImage(
    String sourcePath,
    int x,
    int y,
    int width,
    int height,
  ) async {
    final bytes = await File(sourcePath).readAsBytes();
    final image = img.decodeImage(bytes);

    if (image == null) {
      throw Exception('Failed to decode image');
    }

    // S'assurer que les coordonnées sont dans les limites
    final safeX = x.clamp(0, image.width - 1);
    final safeY = y.clamp(0, image.height - 1);
    final safeWidth = width.clamp(1, image.width - safeX);
    final safeHeight = height.clamp(1, image.height - safeY);

    final cropped = img.copyCrop(
      image,
      x: safeX,
      y: safeY,
      width: safeWidth,
      height: safeHeight,
    );

    // Améliorer le contraste pour l'OCR
    final enhanced = _enhanceForOcr(cropped);

    // Sauvegarder temporairement
    final tempPath =
        '${sourcePath}_crop_${DateTime.now().millisecondsSinceEpoch}.jpg';
    await File(tempPath).writeAsBytes(img.encodeJpg(enhanced));

    return tempPath;
  }

  /// Améliorer l'image pour l'OCR
  img.Image _enhanceForOcr(img.Image image) {
    // Convertir en niveaux de gris
    var enhanced = img.grayscale(image);

    // Augmenter le contraste
    enhanced = img.adjustColor(enhanced, contrast: 1.3);

    // Augmenter la netteté
    enhanced = img.adjustColor(enhanced, saturation: 0);

    return enhanced;
  }

  /// Calculer une confiance basée sur le texte reconnu
  ///
  /// Heuristique :
  /// - Plus de lignes/mots = meilleure confiance
  /// - Texte trop court ou trop long = confiance réduite
  double _calculateConfidence(RecognizedText recognizedText) {
    if (recognizedText.blocks.isEmpty) return 0.0;

    final textLength = recognizedText.text.length;
    final blockCount = recognizedText.blocks.length;
    final lineCount = recognizedText.blocks
        .expand((block) => block.lines)
        .length;

    // Heuristique simple
    double confidence = 0.5; // Base

    // Bonus si plusieurs lignes détectées
    if (lineCount > 1) confidence += 0.2;

    // Pénalité si texte trop court (< 2 caractères)
    if (textLength < 2) confidence -= 0.3;

    // Pénalité si texte trop long (> 50 caractères, peu probable pour un label)
    if (textLength > 50) confidence -= 0.2;

    // Bonus si blocs bien formés
    if (blockCount > 0 && lineCount / blockCount > 0.8) confidence += 0.1;

    return confidence.clamp(0.0, 1.0);
  }

  /// Nettoyer les ressources
  void dispose() {
    _textRecognizer.close();
  }
}

/// Résultat de l'OCR
class OcrResult {
  final String text;
  final double confidence; // 0.0 à 1.0

  OcrResult({required this.text, required this.confidence});

  @override
  String toString() =>
      'OcrResult(text: "$text", confidence: ${confidence.toStringAsFixed(2)})';
}

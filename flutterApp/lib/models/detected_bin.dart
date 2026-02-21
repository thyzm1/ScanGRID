import 'package:freezed_annotation/freezed_annotation.dart';
import 'bin.dart';

part 'detected_bin.freezed.dart';

/// Modèle pour une boîte détectée pendant le scan (avant envoi au serveur)
/// Contient des informations supplémentaires pour la logique de détection
@freezed
class DetectedBin with _$DetectedBin {
  const factory DetectedBin({
    /// Coordonnées et dimensions dans la grille
    required int xGrid,
    required int yGrid,
    required int widthUnits,
    required int depthUnits,

    /// Texte détecté par OCR
    String? labelText,

    /// Niveau de confiance OCR (0.0 à 1.0)
    @Default(0.0) double ocrConfidence,

    /// Coordonnées en pixels (pour le CustomPaint)
    required double pixelX,
    required double pixelY,
    required double pixelWidth,
    required double pixelHeight,

    /// Flag indiquant si c'est un "trou" (détecté sur couche supérieure)
    @Default(false) bool isHole,

    /// Référence à la boîte de la couche inférieure (si isHole = true)
    String? underlyingBinText,
  }) = _DetectedBin;

  const DetectedBin._();

  /// Convertir en BinCreateRequest pour envoi au serveur
  BinCreateRequest toCreateRequest() {
    return BinCreateRequest(
      xGrid: xGrid,
      yGrid: yGrid,
      widthUnits: widthUnits,
      depthUnits: depthUnits,
      labelText: labelText,
    );
  }
}

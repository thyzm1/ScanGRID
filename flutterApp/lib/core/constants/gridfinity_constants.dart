/// Constantes relatives à la grille Gridfinity
class GridfinityConstants {
  GridfinityConstants._();

  /// Taille standard d'une unité Gridfinity en mm
  static const double unitSizeMm = 42.0;

  /// Marge de tolérance pour la détection (en pourcentage)
  static const double detectionTolerance = 0.15; // 15%

  /// Confiance minimale pour l'OCR (0.0 à 1.0)
  static const double minOcrConfidence = 0.5;

  /// Taille minimale d'une boîte en pixels pour être détectée
  static const double minBinSizePixels = 50.0;

  /// Ratio maximum de différence entre deux mesures considérées identiques
  static const double sizeComparisonThreshold = 0.1; // 10%

  /// Tailles de boîtes communes (largeur x profondeur en unités)
  static const List<GridSize> commonSizes = [
    GridSize(1, 1),
    GridSize(2, 1),
    GridSize(1, 2),
    GridSize(2, 2),
    GridSize(3, 1),
    GridSize(1, 3),
    GridSize(3, 2),
    GridSize(2, 3),
    GridSize(3, 3),
    GridSize(4, 2),
    GridSize(2, 4),
  ];
}

/// Représente une taille de grille Gridfinity
class GridSize {
  final int width;
  final int depth;

  const GridSize(this.width, this.depth);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is GridSize &&
          runtimeType == other.runtimeType &&
          width == other.width &&
          depth == other.depth;

  @override
  int get hashCode => width.hashCode ^ depth.hashCode;

  @override
  String toString() => '${width}x$depth';
}

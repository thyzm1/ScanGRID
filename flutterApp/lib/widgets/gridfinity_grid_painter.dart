import 'package:flutter/material.dart';
import '../models/detected_bin.dart';
import '../core/constants/gridfinity_constants.dart';

/// Widget CustomPaint pour afficher une grille Gridfinity interactive
class GridfinityGridPainter extends CustomPainter {
  final List<DetectedBin> bins;
  final int? selectedBinIndex;
  final double gridUnitSize;
  final VoidCallback? onRepaint;

  GridfinityGridPainter({
    required this.bins,
    this.selectedBinIndex,
    this.gridUnitSize = 50.0,
    this.onRepaint,
  }) : super(repaint: null);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    // 1. Dessiner la grille de fond
    _drawBackgroundGrid(canvas, size, paint);

    // 2. Dessiner chaque boîte
    for (int i = 0; i < bins.length; i++) {
      final bin = bins[i];
      final isSelected = i == selectedBinIndex;

      _drawBin(canvas, bin, isSelected);
    }
  }

  /// Dessiner la grille de fond (lignes de repère)
  void _drawBackgroundGrid(Canvas canvas, Size size, Paint paint) {
    paint.color = Colors.grey.shade300;
    paint.strokeWidth = 1.0;

    // Lignes verticales
    for (double x = 0; x < size.width; x += gridUnitSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Lignes horizontales
    for (double y = 0; y < size.height; y += gridUnitSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  /// Dessiner une boîte Gridfinity
  void _drawBin(Canvas canvas, DetectedBin bin, bool isSelected) {
    final rect = Rect.fromLTWH(
      bin.xGrid * gridUnitSize,
      bin.yGrid * gridUnitSize,
      bin.widthUnits * gridUnitSize,
      bin.depthUnits * gridUnitSize,
    );

    // Couleur selon l'état
    Color fillColor;
    Color borderColor;

    if (bin.isHole) {
      // Trou détecté
      fillColor = Colors.orange.withOpacity(0.3);
      borderColor = Colors.orange;
    } else if (isSelected) {
      // Sélectionné
      fillColor = Colors.blue.withOpacity(0.4);
      borderColor = Colors.blue.shade700;
    } else {
      // Normal
      fillColor = Colors.green.withOpacity(0.3);
      borderColor = Colors.green.shade700;
    }

    // Remplissage
    final fillPaint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(8)),
      fillPaint,
    );

    // Bordure
    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = isSelected ? 3.0 : 2.0;
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(8)),
      borderPaint,
    );

    // Afficher le texte du label
    if (bin.labelText != null && bin.labelText!.isNotEmpty) {
      _drawLabel(canvas, rect, bin.labelText!, bin.ocrConfidence);
    }

    // Afficher les coordonnées (debug)
    _drawCoordinates(canvas, rect, bin);
  }

  /// Dessiner le label sur la boîte
  void _drawLabel(Canvas canvas, Rect rect, String text, double confidence) {
    final textSpan = TextSpan(
      text: text,
      style: TextStyle(
        color: Colors.black87,
        fontSize: gridUnitSize * 0.25,
        fontWeight: FontWeight.bold,
      ),
    );

    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    textPainter.layout(maxWidth: rect.width - 8);

    final offset = Offset(
      rect.left + (rect.width - textPainter.width) / 2,
      rect.top + (rect.height - textPainter.height) / 2 - gridUnitSize * 0.1,
    );

    textPainter.paint(canvas, offset);

    // Afficher la confiance en petit
    if (confidence > 0) {
      final confidenceText = TextSpan(
        text: '${(confidence * 100).toInt()}%',
        style: TextStyle(
          color: _getConfidenceColor(confidence),
          fontSize: gridUnitSize * 0.15,
        ),
      );

      final confidencePainter = TextPainter(
        text: confidenceText,
        textDirection: TextDirection.ltr,
      );

      confidencePainter.layout();

      final confidenceOffset = Offset(
        rect.left + (rect.width - confidencePainter.width) / 2,
        rect.top +
            (rect.height - confidencePainter.height) / 2 +
            gridUnitSize * 0.2,
      );

      confidencePainter.paint(canvas, confidenceOffset);
    }
  }

  /// Dessiner les coordonnées de la boîte (coin supérieur gauche)
  void _drawCoordinates(Canvas canvas, Rect rect, DetectedBin bin) {
    final coordText =
        '(${bin.xGrid},${bin.yGrid}) ${bin.widthUnits}x${bin.depthUnits}';

    final textSpan = TextSpan(
      text: coordText,
      style: TextStyle(
        color: Colors.black54,
        fontSize: gridUnitSize * 0.12,
        fontFamily: 'monospace',
      ),
    );

    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );

    textPainter.layout();

    final offset = Offset(rect.left + 4, rect.top + 4);

    // Background semi-transparent
    final bgRect = Rect.fromLTWH(
      offset.dx - 2,
      offset.dy - 2,
      textPainter.width + 4,
      textPainter.height + 4,
    );

    canvas.drawRect(bgRect, Paint()..color = Colors.white.withOpacity(0.8));

    textPainter.paint(canvas, offset);
  }

  /// Obtenir la couleur selon la confiance OCR
  Color _getConfidenceColor(double confidence) {
    if (confidence >= GridfinityConstants.minOcrConfidence) {
      return Colors.green.shade700;
    } else if (confidence >= 0.3) {
      return Colors.orange.shade700;
    } else {
      return Colors.red.shade700;
    }
  }

  @override
  bool shouldRepaint(covariant GridfinityGridPainter oldDelegate) {
    return bins != oldDelegate.bins ||
        selectedBinIndex != oldDelegate.selectedBinIndex ||
        gridUnitSize != oldDelegate.gridUnitSize;
  }
}

/// Widget interactif pour afficher et interagir avec la grille
class InteractiveGridfinityGrid extends StatefulWidget {
  final List<DetectedBin> bins;
  final double gridUnitSize;
  final Function(int)? onBinTapped;

  const InteractiveGridfinityGrid({
    super.key,
    required this.bins,
    this.gridUnitSize = 50.0,
    this.onBinTapped,
  });

  @override
  State<InteractiveGridfinityGrid> createState() =>
      _InteractiveGridfinityGridState();
}

class _InteractiveGridfinityGridState extends State<InteractiveGridfinityGrid> {
  int? _selectedBinIndex;

  @override
  Widget build(BuildContext context) {
    // Calculer la taille de la grille nécessaire
    final gridSize = _calculateGridSize();

    return GestureDetector(
      onTapUp: (details) {
        _handleTap(details.localPosition);
      },
      child: Container(
        width: gridSize.width,
        height: gridSize.height,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          border: Border.all(color: Colors.grey.shade400),
          borderRadius: BorderRadius.circular(8),
        ),
        child: CustomPaint(
          painter: GridfinityGridPainter(
            bins: widget.bins,
            selectedBinIndex: _selectedBinIndex,
            gridUnitSize: widget.gridUnitSize,
          ),
        ),
      ),
    );
  }

  /// Calculer la taille nécessaire pour afficher toute la grille
  Size _calculateGridSize() {
    if (widget.bins.isEmpty) {
      return Size(widget.gridUnitSize * 6, widget.gridUnitSize * 6);
    }

    int maxX = 0;
    int maxY = 0;

    for (final bin in widget.bins) {
      final binMaxX = bin.xGrid + bin.widthUnits;
      final binMaxY = bin.yGrid + bin.depthUnits;

      if (binMaxX > maxX) maxX = binMaxX;
      if (binMaxY > maxY) maxY = binMaxY;
    }

    // Ajouter une marge
    final width = (maxX + 1) * widget.gridUnitSize;
    final height = (maxY + 1) * widget.gridUnitSize;

    return Size(width, height);
  }

  /// Gérer le tap sur la grille
  void _handleTap(Offset position) {
    // Convertir la position en coordonnées de grille
    final gridX = (position.dx / widget.gridUnitSize).floor();
    final gridY = (position.dy / widget.gridUnitSize).floor();

    // Trouver quelle boîte a été tapée
    for (int i = 0; i < widget.bins.length; i++) {
      final bin = widget.bins[i];

      if (gridX >= bin.xGrid &&
          gridX < bin.xGrid + bin.widthUnits &&
          gridY >= bin.yGrid &&
          gridY < bin.yGrid + bin.depthUnits) {
        setState(() {
          _selectedBinIndex = i;
        });

        widget.onBinTapped?.call(i);
        return;
      }
    }

    // Aucune boîte tapée
    setState(() {
      _selectedBinIndex = null;
    });
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:scangrid_flutter/models/detected_bin.dart';
import 'package:scangrid_flutter/models/layer.dart';
import 'package:scangrid_flutter/models/bin.dart';
import 'package:scangrid_flutter/services/layer_comparison_service.dart';

void main() {
  group('LayerComparisonService', () {
    late LayerComparisonService service;

    setUp(() {
      service = LayerComparisonService();
    });

    group('filterHoles', () {
      test('No previous layer - all bins are kept', () {
        final detectedBins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            labelText: 'Résistances',
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
        ];

        final result = service.filterHoles(
          detectedBins: detectedBins,
          previousLayer: null,
        );

        expect(result.length, 1);
        expect(result.first.isHole, false);
      });

      test('Detects hole when text matches underlying bin', () {
        // Couche 0 (fond)
        final previousLayer = const Layer(
          zIndex: 0,
          bins: [
            Bin(
              xGrid: 0,
              yGrid: 0,
              widthUnits: 2,
              depthUnits: 1,
              labelText: 'Résistances',
            ),
          ],
        );

        // Couche 1 - même texte détecté = trou
        final detectedBins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            labelText: 'Résistances', // Même texte -> trou
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
        ];

        final result = service.filterHoles(
          detectedBins: detectedBins,
          previousLayer: previousLayer,
        );

        // Le trou devrait être filtré
        expect(result.length, 0);
      });

      test('Keeps bin when text is different from underlying bin', () {
        final previousLayer = const Layer(
          zIndex: 0,
          bins: [
            Bin(
              xGrid: 0,
              yGrid: 0,
              widthUnits: 2,
              depthUnits: 1,
              labelText: 'Résistances',
            ),
          ],
        );

        final detectedBins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            labelText: 'LEDs', // Texte différent -> vraie boîte
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
        ];

        final result = service.filterHoles(
          detectedBins: detectedBins,
          previousLayer: previousLayer,
        );

        expect(result.length, 1);
        expect(result.first.isHole, false);
        expect(result.first.labelText, 'LEDs');
      });

      test('Handles multiple bins with mixed holes and real bins', () {
        final previousLayer = const Layer(
          zIndex: 0,
          bins: [
            Bin(
              xGrid: 0,
              yGrid: 0,
              widthUnits: 2,
              depthUnits: 1,
              labelText: 'Résistances',
            ),
            Bin(
              xGrid: 2,
              yGrid: 0,
              widthUnits: 1,
              depthUnits: 1,
              labelText: 'LEDs',
            ),
          ],
        );

        final detectedBins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            labelText: 'Résistances', // Trou
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
          const DetectedBin(
            xGrid: 2,
            yGrid: 0,
            widthUnits: 1,
            depthUnits: 1,
            labelText: 'Condensateurs', // Vraie boîte (texte différent)
            pixelX: 200,
            pixelY: 0,
            pixelWidth: 50,
            pixelHeight: 50,
          ),
        ];

        final result = service.filterHoles(
          detectedBins: detectedBins,
          previousLayer: previousLayer,
        );

        expect(result.length, 1); // Seulement la vraie boîte
        expect(result.first.labelText, 'Condensateurs');
      });

      test('Case insensitive text comparison', () {
        final previousLayer = const Layer(
          zIndex: 0,
          bins: [
            Bin(
              xGrid: 0,
              yGrid: 0,
              widthUnits: 1,
              depthUnits: 1,
              labelText: 'RÉSISTANCES',
            ),
          ],
        );

        final detectedBins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 1,
            depthUnits: 1,
            labelText: 'résistances', // Différentes casses mais même texte
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 50,
            pixelHeight: 50,
          ),
        ];

        final result = service.filterHoles(
          detectedBins: detectedBins,
          previousLayer: previousLayer,
        );

        // Devrait détecter le trou malgré la casse différente
        expect(result.length, 0);
      });
    });

    group('validateLayer', () {
      test('No overlaps - returns empty list', () {
        final bins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
          const DetectedBin(
            xGrid: 2,
            yGrid: 0,
            widthUnits: 1,
            depthUnits: 1,
            pixelX: 200,
            pixelY: 0,
            pixelWidth: 50,
            pixelHeight: 50,
          ),
        ];

        final errors = service.validateLayer(bins);

        expect(errors, isEmpty);
      });

      test('Detects overlap', () {
        final bins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 3,
            depthUnits: 2,
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 150,
            pixelHeight: 100,
          ),
          const DetectedBin(
            xGrid: 2,
            yGrid: 1,
            widthUnits: 2,
            depthUnits: 1,
            pixelX: 100,
            pixelY: 50,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
        ];

        final errors = service.validateLayer(bins);

        expect(errors, isNotEmpty);
        expect(errors.first, contains('Chevauchement'));
      });

      test('Adjacent bins are not considered overlapping', () {
        final bins = [
          const DetectedBin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            pixelX: 0,
            pixelY: 0,
            pixelWidth: 100,
            pixelHeight: 50,
          ),
          const DetectedBin(
            xGrid: 2,
            yGrid: 0,
            widthUnits: 1,
            depthUnits: 1,
            pixelX: 100,
            pixelY: 0,
            pixelWidth: 50,
            pixelHeight: 50,
          ),
        ];

        final errors = service.validateLayer(bins);

        expect(
          errors,
          isEmpty,
        ); // Adjacents ne comptent pas comme chevauchement
      });
    });
  });
}

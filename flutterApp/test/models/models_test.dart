import 'package:flutter_test/flutter_test.dart';
import 'package:scangrid_flutter/models/bin.dart';
import 'package:scangrid_flutter/models/layer.dart';
import 'package:scangrid_flutter/models/drawer.dart';

void main() {
  group('Bin Model', () {
    test('Serialization - toJson', () {
      const bin = Bin(
        binId: 'test-123',
        xGrid: 2,
        yGrid: 1,
        widthUnits: 3,
        depthUnits: 2,
        labelText: 'Test Label',
      );

      final json = bin.toJson();

      expect(json['bin_id'], 'test-123');
      expect(json['x_grid'], 2);
      expect(json['y_grid'], 1);
      expect(json['width_units'], 3);
      expect(json['depth_units'], 2);
      expect(json['label_text'], 'Test Label');
    });

    test('Deserialization - fromJson', () {
      final json = {
        'bin_id': 'test-456',
        'x_grid': 0,
        'y_grid': 3,
        'width_units': 1,
        'depth_units': 1,
        'label_text': 'Autre Label',
      };

      final bin = Bin.fromJson(json);

      expect(bin.binId, 'test-456');
      expect(bin.xGrid, 0);
      expect(bin.yGrid, 3);
      expect(bin.widthUnits, 1);
      expect(bin.depthUnits, 1);
      expect(bin.labelText, 'Autre Label');
    });

    test('BinCreateRequest without ID', () {
      const request = BinCreateRequest(
        xGrid: 1,
        yGrid: 2,
        widthUnits: 2,
        depthUnits: 1,
        labelText: 'New Bin',
      );

      final json = request.toJson();

      expect(json.containsKey('bin_id'), false); // Pas d'ID dans la création
      expect(json['x_grid'], 1);
      expect(json['label_text'], 'New Bin');
    });
  });

  group('Layer Model', () {
    test('Serialization with bins', () {
      const layer = Layer(
        layerId: 'layer-1',
        zIndex: 0,
        bins: [
          Bin(
            xGrid: 0,
            yGrid: 0,
            widthUnits: 2,
            depthUnits: 1,
            labelText: 'Bin 1',
          ),
          Bin(
            xGrid: 2,
            yGrid: 0,
            widthUnits: 1,
            depthUnits: 1,
            labelText: 'Bin 2',
          ),
        ],
      );

      final json = layer.toJson();

      expect(json['layer_id'], 'layer-1');
      expect(json['z_index'], 0);
      expect(json['bins'], isA<List>());
      expect((json['bins'] as List).length, 2);
    });

    test('Deserialization', () {
      final json = {
        'layer_id': 'layer-2',
        'z_index': 1,
        'bins': [
          {
            'x_grid': 1,
            'y_grid': 1,
            'width_units': 1,
            'depth_units': 1,
            'label_text': 'Test',
          },
        ],
      };

      final layer = Layer.fromJson(json);

      expect(layer.layerId, 'layer-2');
      expect(layer.zIndex, 1);
      expect(layer.bins.length, 1);
      expect(layer.bins.first.labelText, 'Test');
    });
  });

  group('Drawer Model', () {
    test('Complete drawer serialization', () {
      const drawer = Drawer(
        drawerId: 'drawer-1',
        name: 'Test Drawer',
        layers: [
          Layer(
            zIndex: 0,
            bins: [
              Bin(
                xGrid: 0,
                yGrid: 0,
                widthUnits: 1,
                depthUnits: 1,
                labelText: 'Component',
              ),
            ],
          ),
        ],
      );

      final json = drawer.toJson();

      expect(json['drawer_id'], 'drawer-1');
      expect(json['name'], 'Test Drawer');
      expect(json['layers'], isA<List>());
      expect((json['layers'] as List).length, 1);
    });

    test('DrawerCreateRequest structure', () {
      const request = DrawerCreateRequest(
        name: 'New Drawer',
        layers: [
          LayerCreateRequest(
            zIndex: 0,
            bins: [
              BinCreateRequest(
                xGrid: 0,
                yGrid: 0,
                widthUnits: 2,
                depthUnits: 1,
                labelText: 'Test Bin',
              ),
            ],
          ),
        ],
      );

      final json = request.toJson();

      expect(json['name'], 'New Drawer');
      expect(json['layers'], isA<List>());

      final layerJson = (json['layers'] as List).first as Map<String, dynamic>;
      expect(layerJson['z_index'], 0);
      expect(
        layerJson.containsKey('layer_id'),
        false,
      ); // Pas d'ID dans la création
    });
  });
}

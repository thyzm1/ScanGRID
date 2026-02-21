import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../providers/scan_providers.dart';
import '../edit/edit_grid_screen.dart';

/// Écran de scan avec caméra
class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  CameraController? _cameraController;
  bool _isInitialized = false;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    final camerasAsync = ref.read(camerasProvider);

    camerasAsync.when(
      data: (cameras) async {
        if (cameras.isEmpty) return;

        // Utiliser la caméra arrière par défaut
        final camera = cameras.firstWhere(
          (cam) => cam.lensDirection == CameraLensDirection.back,
          orElse: () => cameras.first,
        );

        _cameraController = CameraController(
          camera,
          ResolutionPreset.high,
          enableAudio: false,
        );

        await _cameraController!.initialize();

        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
        }
      },
      loading: () {},
      error: (_, __) {},
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scanState = ref.watch(scanProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Scanner - Couche ${scanState.currentZIndex}'),
        actions: [
          if (scanState.previousLayers.isNotEmpty)
            TextButton.icon(
              onPressed: () => _showLayersPreview(),
              icon: const Icon(Icons.layers),
              label: Text('${scanState.previousLayers.length}'),
            ),
        ],
      ),
      body: Stack(
        children: [
          // Aperçu de la caméra
          if (_isInitialized && _cameraController != null)
            Center(
              child: AspectRatio(
                aspectRatio: _cameraController!.value.aspectRatio,
                child: CameraPreview(_cameraController!),
              ),
            )
          else
            const Center(child: CircularProgressIndicator()),

          // Overlay avec instructions
          if (_isInitialized)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Card(
                color: Colors.black54,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        scanState.currentZIndex == 0
                            ? '📸 Photographiez le fond du tiroir'
                            : '📸 Photographiez la couche ${scanState.currentZIndex}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Positionnez la caméra bien au-dessus du tiroir, '
                        'perpendiculairement à la surface.',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Bouton de capture
          if (_isInitialized && !_isProcessing)
            Positioned(
              bottom: 32,
              left: 0,
              right: 0,
              child: Center(
                child: FloatingActionButton.large(
                  onPressed: _captureAndProcess,
                  child: const Icon(Icons.camera, size: 40),
                ),
              ),
            ),

          // Indicateur de traitement
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text(
                      'Analyse de l\'image en cours...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _captureAndProcess() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    try {
      // 1. Capturer l'image
      final image = await _cameraController!.takePicture();

      // 2. Scanner l'image
      await ref.read(scanProvider.notifier).scanImage(image.path);

      // 3. Naviguer vers l'écran d'édition
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const EditGridScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors du scan: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  void _showLayersPreview() {
    final scanState = ref.read(scanProvider);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Couches scannées'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: scanState.previousLayers.length,
            itemBuilder: (context, index) {
              final layer = scanState.previousLayers[index];
              return ListTile(
                leading: CircleAvatar(child: Text('${layer.zIndex}')),
                title: Text('Couche ${layer.zIndex}'),
                subtitle: Text('${layer.bins.length} boîte(s)'),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }
}

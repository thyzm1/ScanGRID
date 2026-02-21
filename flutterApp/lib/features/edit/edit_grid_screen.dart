import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/scan_providers.dart';
import '../../providers/drawer_providers.dart';
import '../../widgets/gridfinity_grid_painter.dart';
import '../../models/detected_bin.dart';
import '../../models/drawer.dart';
import '../../models/layer.dart';
import '../../models/bin.dart';

/// Écran d'édition de la grille détectée
class EditGridScreen extends ConsumerStatefulWidget {
  const EditGridScreen({super.key});

  @override
  ConsumerState<EditGridScreen> createState() => _EditGridScreenState();
}

class _EditGridScreenState extends ConsumerState<EditGridScreen> {
  final TextEditingController _drawerNameController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _drawerNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scanState = ref.watch(scanProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Édition - Couche ${scanState.currentZIndex}'),
        actions: [
          if (scanState.detectedBins.isNotEmpty)
            TextButton.icon(
              onPressed: _saveAndContinue,
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('Couche suivante'),
            ),
        ],
      ),
      body: scanState.isScanning
          ? const Center(child: CircularProgressIndicator())
          : scanState.detectedBins.isEmpty
              ? _buildEmptyState()
              : _buildEditView(scanState),
      bottomNavigationBar: scanState.detectedBins.isNotEmpty &&
              scanState.previousLayers.isNotEmpty
          ? _buildBottomBar(scanState)
          : null,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Aucune boîte détectée',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text(
              'Essayez de reprendre la photo avec un meilleur éclairage',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEditView(ScanState scanState) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Statistiques
          _buildStatsBanner(scanState),

          // Grille interactive
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: InteractiveGridfinityGrid(
                    bins: scanState.detectedBins,
                    gridUnitSize: 60,
                    onBinTapped: (index) => _showEditBinDialog(index),
                  ),
                ),
              ),
            ),
          ),

          // Liste des boîtes
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Boîtes détectées',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                ...scanState.detectedBins.asMap().entries.map((entry) {
                  return _buildBinCard(entry.key, entry.value);
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsBanner(ScanState scanState) {
    final realBins = scanState.detectedBins.where((b) => !b.isHole).length;
    final holes = scanState.detectedBins.where((b) => b.isHole).length;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(
            Icons.inventory_2,
            realBins.toString(),
            'Boîtes réelles',
          ),
          if (holes > 0)
            _buildStatItem(
              Icons.remove_circle_outline,
              holes.toString(),
              'Trous détectés',
            ),
          _buildStatItem(
            Icons.layers,
            scanState.currentZIndex.toString(),
            'Couche actuelle',
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, size: 32),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildBinCard(int index, DetectedBin bin) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: bin.isHole
              ? Colors.orange
              : Theme.of(context).colorScheme.primary,
          child: Text('${index + 1}'),
        ),
        title: Text(
          bin.labelText?.isNotEmpty == true ? bin.labelText! : 'Sans label',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: bin.labelText?.isEmpty == true ? Colors.grey : null,
          ),
        ),
        subtitle: Text(
          'Position: (${bin.xGrid}, ${bin.yGrid}) • '
          'Taille: ${bin.widthUnits}x${bin.depthUnits}'
          '${bin.isHole ? ' • TROU' : ''}',
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (bin.ocrConfidence > 0)
              Chip(
                label: Text('${(bin.ocrConfidence * 100).toInt()}%'),
                backgroundColor: _getConfidenceColor(bin.ocrConfidence),
                labelStyle: const TextStyle(fontSize: 10),
              ),
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => _showEditBinDialog(index),
            ),
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: () =>
                  ref.read(scanProvider.notifier).removeDetectedBin(index),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(ScanState scanState) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (scanState.currentZIndex == 0)
              TextField(
                controller: _drawerNameController,
                decoration: const InputDecoration(
                  labelText: 'Nom du tiroir',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.label),
                ),
              ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _isSaving ? null : _finishAndSave,
              icon: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.save),
              label: Text(
                scanState.previousLayers.isEmpty
                    ? 'Terminer et enregistrer'
                    : 'Enregistrer le tiroir',
              ),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 0.7) return Colors.green.shade100;
    if (confidence >= 0.5) return Colors.orange.shade100;
    return Colors.red.shade100;
  }

  void _showEditBinDialog(int index) {
    final bin = ref.read(scanProvider).detectedBins[index];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _EditBinSheet(
        bin: bin,
        onSave: (updatedBin) {
          ref.read(scanProvider.notifier).updateDetectedBin(index, updatedBin);
          Navigator.pop(context);
        },
      ),
    );
  }

  void _saveAndContinue() {
    ref.read(scanProvider.notifier).moveToNextLayer();
    Navigator.pop(context); // Retour au scan pour la prochaine couche
  }

  Future<void> _finishAndSave() async {
    setState(() {
      _isSaving = true;
    });

    final scanState = ref.read(scanProvider);

    // Nom du tiroir (obligatoire)
    final drawerName = _drawerNameController.text.trim().isEmpty
        ? 'Tiroir ${DateTime.now().toIso8601String().substring(0, 10)}'
        : _drawerNameController.text.trim();

    // Construire la requête
    final layers = <LayerCreateRequest>[];

    // Ajouter les couches précédentes
    for (final layer in scanState.previousLayers) {
      final bins = layer.bins
          .map((bin) => BinCreateRequest(
                xGrid: bin.xGrid,
                yGrid: bin.yGrid,
                widthUnits: bin.widthUnits,
                depthUnits: bin.depthUnits,
                labelText: bin.labelText,
              ))
          .toList();

      layers.add(LayerCreateRequest(zIndex: layer.zIndex, bins: bins));
    }

    // Ajouter la couche actuelle si elle contient des boîtes
    if (scanState.detectedBins.isNotEmpty) {
      final currentBins = scanState.detectedBins
          .where((b) => !b.isHole)
          .map((bin) => bin.toCreateRequest())
          .toList();

      if (currentBins.isNotEmpty) {
        layers.add(LayerCreateRequest(
          zIndex: scanState.currentZIndex,
          bins: currentBins,
        ));
      }
    }

    if (layers.isEmpty) {
      setState(() {
        _isSaving = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Aucune boîte à enregistrer'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final request = DrawerCreateRequest(name: drawerName, layers: layers);

    // Envoyer au serveur
    final drawer =
        await ref.read(drawerListProvider.notifier).createDrawer(request);

    setState(() {
      _isSaving = false;
    });

    if (drawer != null && mounted) {
      // Réinitialiser le scan
      ref.read(scanProvider.notifier).startNewScan();

      // Retour à l'accueil
      Navigator.of(context).popUntil((route) => route.isFirst);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tiroir "${drawer.name}" créé avec succès!'),
          backgroundColor: Colors.green,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur lors de l\'enregistrement'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

/// Sheet pour éditer une boîte
class _EditBinSheet extends StatefulWidget {
  final DetectedBin bin;
  final Function(DetectedBin) onSave;

  const _EditBinSheet({required this.bin, required this.onSave});

  @override
  State<_EditBinSheet> createState() => _EditBinSheetState();
}

class _EditBinSheetState extends State<_EditBinSheet> {
  late TextEditingController _labelController;
  late int _widthUnits;
  late int _depthUnits;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.bin.labelText ?? '');
    _widthUnits = widget.bin.widthUnits;
    _depthUnits = widget.bin.depthUnits;
  }

  @override
  void dispose() {
    _labelController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Éditer la boîte',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _labelController,
              decoration: const InputDecoration(
                labelText: 'Texte du label',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.label),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<int>(
                    value: _widthUnits,
                    decoration: const InputDecoration(
                      labelText: 'Largeur',
                      border: OutlineInputBorder(),
                    ),
                    items: List.generate(6, (i) => i + 1).map((value) {
                      return DropdownMenuItem(
                        value: value,
                        child: Text('$value unité${value > 1 ? 's' : ''}'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _widthUnits = value;
                        });
                      }
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<int>(
                    value: _depthUnits,
                    decoration: const InputDecoration(
                      labelText: 'Profondeur',
                      border: OutlineInputBorder(),
                    ),
                    items: List.generate(6, (i) => i + 1).map((value) {
                      return DropdownMenuItem(
                        value: value,
                        child: Text('$value unité${value > 1 ? 's' : ''}'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _depthUnits = value;
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {
                final updated = widget.bin.copyWith(
                  labelText: _labelController.text.trim(),
                  widthUnits: _widthUnits,
                  depthUnits: _depthUnits,
                );
                widget.onSave(updated);
              },
              icon: const Icon(Icons.save),
              label: const Text('Enregistrer'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

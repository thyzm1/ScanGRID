import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/drawer_providers.dart';

/// Écran affichant la liste des tiroirs
class DrawerListScreen extends ConsumerStatefulWidget {
  const DrawerListScreen({super.key});

  @override
  ConsumerState<DrawerListScreen> createState() => _DrawerListScreenState();
}

class _DrawerListScreenState extends ConsumerState<DrawerListScreen> {
  @override
  void initState() {
    super.initState();
    // Charger les tiroirs au démarrage
    Future.microtask(() {
      ref.read(drawerListProvider.notifier).loadDrawers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final drawerState = ref.watch(drawerListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Tiroirs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(drawerListProvider.notifier).loadDrawers();
            },
          ),
        ],
      ),
      body: _buildBody(drawerState),
    );
  }

  Widget _buildBody(DrawerListState state) {
    if (state.loadingState == LoadingState.loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.loadingState == LoadingState.error) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text('Erreur', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                state.errorMessage ?? 'Une erreur est survenue',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  ref.read(drawerListProvider.notifier).loadDrawers();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.drawers.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.inventory_2_outlined,
                size: 80,
                color: Colors.grey.shade300,
              ),
              const SizedBox(height: 16),
              Text(
                'Aucun tiroir',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                'Scannez votre premier tiroir pour commencer',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: state.drawers.length,
      itemBuilder: (context, index) {
        final drawer = state.drawers[index];
        final totalBins = drawer.layers.fold<int>(
          0,
          (sum, layer) => sum + layer.bins.length,
        );

        return Card(
          margin: const EdgeInsets.all(8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Icon(
                Icons.inventory_2,
                color: Theme.of(context).colorScheme.onPrimaryContainer,
              ),
            ),
            title: Text(
              drawer.name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${drawer.layers.length} couche(s) • $totalBins boîte(s)',
            ),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () =>
                  _confirmDelete(context, drawer.drawerId!, drawer.name),
            ),
            onTap: () {
              // TODO: Naviguer vers les détails du tiroir
            },
          ),
        );
      },
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    String drawerId,
    String name,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer le tiroir'),
        content: Text('Voulez-vous vraiment supprimer "$name" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final success = await ref
          .read(drawerListProvider.notifier)
          .deleteDrawer(drawerId);

      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tiroir "$name" supprimé'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }
}

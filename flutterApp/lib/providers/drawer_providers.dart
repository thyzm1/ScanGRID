import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/drawer.dart';
import '../services/api_service.dart';
import 'service_providers.dart';

// ==================== STATE ====================

/// État de chargement pour les opérations async
enum LoadingState { initial, loading, loaded, error }

/// État pour la liste des tiroirs
class DrawerListState {
  final List<Drawer> drawers;
  final LoadingState loadingState;
  final String? errorMessage;

  DrawerListState({
    this.drawers = const [],
    this.loadingState = LoadingState.initial,
    this.errorMessage,
  });

  DrawerListState copyWith({
    List<Drawer>? drawers,
    LoadingState? loadingState,
    String? errorMessage,
  }) {
    return DrawerListState(
      drawers: drawers ?? this.drawers,
      loadingState: loadingState ?? this.loadingState,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

// ==================== NOTIFIERS ====================

/// Notifier pour gérer la liste des tiroirs
class DrawerListNotifier extends StateNotifier<DrawerListState> {
  final ApiService _apiService;

  DrawerListNotifier(this._apiService) : super(DrawerListState());

  /// Charger tous les tiroirs
  Future<void> loadDrawers() async {
    state = state.copyWith(loadingState: LoadingState.loading);

    try {
      final drawers = await _apiService.listDrawers();
      state = state.copyWith(
        drawers: drawers,
        loadingState: LoadingState.loaded,
        errorMessage: null,
      );
    } on ApiException catch (e) {
      state = state.copyWith(
        loadingState: LoadingState.error,
        errorMessage: e.message,
      );
    } catch (e) {
      state = state.copyWith(
        loadingState: LoadingState.error,
        errorMessage: 'Erreur inattendue: $e',
      );
    }
  }

  /// Créer un nouveau tiroir
  Future<Drawer?> createDrawer(DrawerCreateRequest request) async {
    try {
      final drawer = await _apiService.createDrawer(request);

      // Ajouter à la liste
      state = state.copyWith(drawers: [...state.drawers, drawer]);

      return drawer;
    } on ApiException catch (e) {
      state = state.copyWith(
        loadingState: LoadingState.error,
        errorMessage: e.message,
      );
      return null;
    }
  }

  /// Supprimer un tiroir
  Future<bool> deleteDrawer(String drawerId) async {
    try {
      await _apiService.deleteDrawer(drawerId);

      // Retirer de la liste
      state = state.copyWith(
        drawers: state.drawers.where((d) => d.drawerId != drawerId).toList(),
      );

      return true;
    } on ApiException catch (e) {
      state = state.copyWith(
        loadingState: LoadingState.error,
        errorMessage: e.message,
      );
      return false;
    }
  }

  /// Récupérer un tiroir spécifique
  Future<Drawer?> getDrawer(String drawerId) async {
    try {
      return await _apiService.getDrawer(drawerId);
    } on ApiException catch (e) {
      state = state.copyWith(
        loadingState: LoadingState.error,
        errorMessage: e.message,
      );
      return null;
    }
  }
}

// ==================== PROVIDERS ====================

/// Provider pour la liste des tiroirs
final drawerListProvider =
    StateNotifierProvider<DrawerListNotifier, DrawerListState>((ref) {
      final apiService = ref.watch(apiServiceProvider);
      return DrawerListNotifier(apiService);
    });

/// Provider pour vérifier la santé du serveur
final serverHealthProvider = FutureProvider<bool>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.checkHealth();
});

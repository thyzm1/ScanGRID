import 'package:freezed_annotation/freezed_annotation.dart';
import 'layer.dart';

part 'drawer.freezed.dart';
part 'drawer.g.dart';

/// Modèle représentant un tiroir complet
@freezed
class Drawer with _$Drawer {
  const factory Drawer({
    /// ID unique (généré par le serveur, optionnel côté client)
    @JsonKey(name: 'drawer_id') String? drawerId,

    /// Nom du tiroir
    required String name,

    /// Liste des couches du tiroir
    @Default([]) List<Layer> layers,
  }) = _Drawer;

  factory Drawer.fromJson(Map<String, dynamic> json) => _$DrawerFromJson(json);
}

/// Request pour créer un tiroir complet
@freezed
class DrawerCreateRequest with _$DrawerCreateRequest {
  const factory DrawerCreateRequest({
    required String name,
    @Default([]) List<LayerCreateRequest> layers,
  }) = _DrawerCreateRequest;

  factory DrawerCreateRequest.fromJson(Map<String, dynamic> json) =>
      _$DrawerCreateRequestFromJson(json);
}

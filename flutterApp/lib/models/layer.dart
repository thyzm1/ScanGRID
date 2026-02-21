import 'package:freezed_annotation/freezed_annotation.dart';
import 'bin.dart';

part 'layer.freezed.dart';
part 'layer.g.dart';

/// Modèle représentant une couche (niveau) d'un tiroir
@freezed
class Layer with _$Layer {
  const factory Layer({
    /// ID unique (généré par le serveur, optionnel côté client)
    @JsonKey(name: 'layer_id') String? layerId,

    /// Index de hauteur (0 = fond, 1 = au-dessus, etc.)
    @JsonKey(name: 'z_index') required int zIndex,

    /// Liste des boîtes sur cette couche
    @Default([]) List<Bin> bins,
  }) = _Layer;

  factory Layer.fromJson(Map<String, dynamic> json) => _$LayerFromJson(json);
}

/// Request pour créer une couche
@freezed
class LayerCreateRequest with _$LayerCreateRequest {
  const factory LayerCreateRequest({
    @JsonKey(name: 'z_index') required int zIndex,
    @Default([]) List<BinCreateRequest> bins,
  }) = _LayerCreateRequest;

  factory LayerCreateRequest.fromJson(Map<String, dynamic> json) =>
      _$LayerCreateRequestFromJson(json);
}

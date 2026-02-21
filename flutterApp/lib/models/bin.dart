import 'package:freezed_annotation/freezed_annotation.dart';

part 'bin.freezed.dart';
part 'bin.g.dart';

/// Modèle représentant une boîte Gridfinity individuelle
@freezed
class Bin with _$Bin {
  const factory Bin({
    /// ID unique (généré par le serveur, optionnel côté client)
    @JsonKey(name: 'bin_id') String? binId,

    /// Coordonnée X dans la grille (>= 0)
    @JsonKey(name: 'x_grid') required int xGrid,

    /// Coordonnée Y dans la grille (>= 0)
    @JsonKey(name: 'y_grid') required int yGrid,

    /// Largeur en unités Gridfinity (>= 1)
    @JsonKey(name: 'width_units') required int widthUnits,

    /// Profondeur en unités Gridfinity (>= 1)
    @JsonKey(name: 'depth_units') required int depthUnits,

    /// Texte du label (OCR ou manuel, optionnel)
    @JsonKey(name: 'label_text') String? labelText,
  }) = _Bin;

  factory Bin.fromJson(Map<String, dynamic> json) => _$BinFromJson(json);
}

/// Request pour créer une boîte (sans ID)
@freezed
class BinCreateRequest with _$BinCreateRequest {
  const factory BinCreateRequest({
    @JsonKey(name: 'x_grid') required int xGrid,
    @JsonKey(name: 'y_grid') required int yGrid,
    @JsonKey(name: 'width_units') required int widthUnits,
    @JsonKey(name: 'depth_units') required int depthUnits,
    @JsonKey(name: 'label_text') String? labelText,
  }) = _BinCreateRequest;

  factory BinCreateRequest.fromJson(Map<String, dynamic> json) =>
      _$BinCreateRequestFromJson(json);
}

/// Request pour mettre à jour une boîte (tous champs optionnels)
@freezed
class BinUpdateRequest with _$BinUpdateRequest {
  const factory BinUpdateRequest({
    @JsonKey(name: 'x_grid') int? xGrid,
    @JsonKey(name: 'y_grid') int? yGrid,
    @JsonKey(name: 'width_units') int? widthUnits,
    @JsonKey(name: 'depth_units') int? depthUnits,
    @JsonKey(name: 'label_text') String? labelText,
  }) = _BinUpdateRequest;

  factory BinUpdateRequest.fromJson(Map<String, dynamic> json) =>
      _$BinUpdateRequestFromJson(json);
}

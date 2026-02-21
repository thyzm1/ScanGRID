// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'bin.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Bin _$BinFromJson(Map<String, dynamic> json) {
  return _Bin.fromJson(json);
}

/// @nodoc
mixin _$Bin {
  /// ID unique (généré par le serveur, optionnel côté client)
  @JsonKey(name: 'bin_id')
  String? get binId => throw _privateConstructorUsedError;

  /// Coordonnée X dans la grille (>= 0)
  @JsonKey(name: 'x_grid')
  int get xGrid => throw _privateConstructorUsedError;

  /// Coordonnée Y dans la grille (>= 0)
  @JsonKey(name: 'y_grid')
  int get yGrid => throw _privateConstructorUsedError;

  /// Largeur en unités Gridfinity (>= 1)
  @JsonKey(name: 'width_units')
  int get widthUnits => throw _privateConstructorUsedError;

  /// Profondeur en unités Gridfinity (>= 1)
  @JsonKey(name: 'depth_units')
  int get depthUnits => throw _privateConstructorUsedError;

  /// Texte du label (OCR ou manuel, optionnel)
  @JsonKey(name: 'label_text')
  String? get labelText => throw _privateConstructorUsedError;

  /// Serializes this Bin to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Bin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BinCopyWith<Bin> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BinCopyWith<$Res> {
  factory $BinCopyWith(Bin value, $Res Function(Bin) then) =
      _$BinCopyWithImpl<$Res, Bin>;
  @useResult
  $Res call(
      {@JsonKey(name: 'bin_id') String? binId,
      @JsonKey(name: 'x_grid') int xGrid,
      @JsonKey(name: 'y_grid') int yGrid,
      @JsonKey(name: 'width_units') int widthUnits,
      @JsonKey(name: 'depth_units') int depthUnits,
      @JsonKey(name: 'label_text') String? labelText});
}

/// @nodoc
class _$BinCopyWithImpl<$Res, $Val extends Bin> implements $BinCopyWith<$Res> {
  _$BinCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Bin
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? binId = freezed,
    Object? xGrid = null,
    Object? yGrid = null,
    Object? widthUnits = null,
    Object? depthUnits = null,
    Object? labelText = freezed,
  }) {
    return _then(_value.copyWith(
      binId: freezed == binId
          ? _value.binId
          : binId // ignore: cast_nullable_to_non_nullable
              as String?,
      xGrid: null == xGrid
          ? _value.xGrid
          : xGrid // ignore: cast_nullable_to_non_nullable
              as int,
      yGrid: null == yGrid
          ? _value.yGrid
          : yGrid // ignore: cast_nullable_to_non_nullable
              as int,
      widthUnits: null == widthUnits
          ? _value.widthUnits
          : widthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      depthUnits: null == depthUnits
          ? _value.depthUnits
          : depthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      labelText: freezed == labelText
          ? _value.labelText
          : labelText // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BinImplCopyWith<$Res> implements $BinCopyWith<$Res> {
  factory _$$BinImplCopyWith(_$BinImpl value, $Res Function(_$BinImpl) then) =
      __$$BinImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'bin_id') String? binId,
      @JsonKey(name: 'x_grid') int xGrid,
      @JsonKey(name: 'y_grid') int yGrid,
      @JsonKey(name: 'width_units') int widthUnits,
      @JsonKey(name: 'depth_units') int depthUnits,
      @JsonKey(name: 'label_text') String? labelText});
}

/// @nodoc
class __$$BinImplCopyWithImpl<$Res> extends _$BinCopyWithImpl<$Res, _$BinImpl>
    implements _$$BinImplCopyWith<$Res> {
  __$$BinImplCopyWithImpl(_$BinImpl _value, $Res Function(_$BinImpl) _then)
      : super(_value, _then);

  /// Create a copy of Bin
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? binId = freezed,
    Object? xGrid = null,
    Object? yGrid = null,
    Object? widthUnits = null,
    Object? depthUnits = null,
    Object? labelText = freezed,
  }) {
    return _then(_$BinImpl(
      binId: freezed == binId
          ? _value.binId
          : binId // ignore: cast_nullable_to_non_nullable
              as String?,
      xGrid: null == xGrid
          ? _value.xGrid
          : xGrid // ignore: cast_nullable_to_non_nullable
              as int,
      yGrid: null == yGrid
          ? _value.yGrid
          : yGrid // ignore: cast_nullable_to_non_nullable
              as int,
      widthUnits: null == widthUnits
          ? _value.widthUnits
          : widthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      depthUnits: null == depthUnits
          ? _value.depthUnits
          : depthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      labelText: freezed == labelText
          ? _value.labelText
          : labelText // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BinImpl implements _Bin {
  const _$BinImpl(
      {@JsonKey(name: 'bin_id') this.binId,
      @JsonKey(name: 'x_grid') required this.xGrid,
      @JsonKey(name: 'y_grid') required this.yGrid,
      @JsonKey(name: 'width_units') required this.widthUnits,
      @JsonKey(name: 'depth_units') required this.depthUnits,
      @JsonKey(name: 'label_text') this.labelText});

  factory _$BinImpl.fromJson(Map<String, dynamic> json) =>
      _$$BinImplFromJson(json);

  /// ID unique (généré par le serveur, optionnel côté client)
  @override
  @JsonKey(name: 'bin_id')
  final String? binId;

  /// Coordonnée X dans la grille (>= 0)
  @override
  @JsonKey(name: 'x_grid')
  final int xGrid;

  /// Coordonnée Y dans la grille (>= 0)
  @override
  @JsonKey(name: 'y_grid')
  final int yGrid;

  /// Largeur en unités Gridfinity (>= 1)
  @override
  @JsonKey(name: 'width_units')
  final int widthUnits;

  /// Profondeur en unités Gridfinity (>= 1)
  @override
  @JsonKey(name: 'depth_units')
  final int depthUnits;

  /// Texte du label (OCR ou manuel, optionnel)
  @override
  @JsonKey(name: 'label_text')
  final String? labelText;

  @override
  String toString() {
    return 'Bin(binId: $binId, xGrid: $xGrid, yGrid: $yGrid, widthUnits: $widthUnits, depthUnits: $depthUnits, labelText: $labelText)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BinImpl &&
            (identical(other.binId, binId) || other.binId == binId) &&
            (identical(other.xGrid, xGrid) || other.xGrid == xGrid) &&
            (identical(other.yGrid, yGrid) || other.yGrid == yGrid) &&
            (identical(other.widthUnits, widthUnits) ||
                other.widthUnits == widthUnits) &&
            (identical(other.depthUnits, depthUnits) ||
                other.depthUnits == depthUnits) &&
            (identical(other.labelText, labelText) ||
                other.labelText == labelText));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, binId, xGrid, yGrid, widthUnits, depthUnits, labelText);

  /// Create a copy of Bin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BinImplCopyWith<_$BinImpl> get copyWith =>
      __$$BinImplCopyWithImpl<_$BinImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BinImplToJson(
      this,
    );
  }
}

abstract class _Bin implements Bin {
  const factory _Bin(
      {@JsonKey(name: 'bin_id') final String? binId,
      @JsonKey(name: 'x_grid') required final int xGrid,
      @JsonKey(name: 'y_grid') required final int yGrid,
      @JsonKey(name: 'width_units') required final int widthUnits,
      @JsonKey(name: 'depth_units') required final int depthUnits,
      @JsonKey(name: 'label_text') final String? labelText}) = _$BinImpl;

  factory _Bin.fromJson(Map<String, dynamic> json) = _$BinImpl.fromJson;

  /// ID unique (généré par le serveur, optionnel côté client)
  @override
  @JsonKey(name: 'bin_id')
  String? get binId;

  /// Coordonnée X dans la grille (>= 0)
  @override
  @JsonKey(name: 'x_grid')
  int get xGrid;

  /// Coordonnée Y dans la grille (>= 0)
  @override
  @JsonKey(name: 'y_grid')
  int get yGrid;

  /// Largeur en unités Gridfinity (>= 1)
  @override
  @JsonKey(name: 'width_units')
  int get widthUnits;

  /// Profondeur en unités Gridfinity (>= 1)
  @override
  @JsonKey(name: 'depth_units')
  int get depthUnits;

  /// Texte du label (OCR ou manuel, optionnel)
  @override
  @JsonKey(name: 'label_text')
  String? get labelText;

  /// Create a copy of Bin
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BinImplCopyWith<_$BinImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BinCreateRequest _$BinCreateRequestFromJson(Map<String, dynamic> json) {
  return _BinCreateRequest.fromJson(json);
}

/// @nodoc
mixin _$BinCreateRequest {
  @JsonKey(name: 'x_grid')
  int get xGrid => throw _privateConstructorUsedError;
  @JsonKey(name: 'y_grid')
  int get yGrid => throw _privateConstructorUsedError;
  @JsonKey(name: 'width_units')
  int get widthUnits => throw _privateConstructorUsedError;
  @JsonKey(name: 'depth_units')
  int get depthUnits => throw _privateConstructorUsedError;
  @JsonKey(name: 'label_text')
  String? get labelText => throw _privateConstructorUsedError;

  /// Serializes this BinCreateRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BinCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BinCreateRequestCopyWith<BinCreateRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BinCreateRequestCopyWith<$Res> {
  factory $BinCreateRequestCopyWith(
          BinCreateRequest value, $Res Function(BinCreateRequest) then) =
      _$BinCreateRequestCopyWithImpl<$Res, BinCreateRequest>;
  @useResult
  $Res call(
      {@JsonKey(name: 'x_grid') int xGrid,
      @JsonKey(name: 'y_grid') int yGrid,
      @JsonKey(name: 'width_units') int widthUnits,
      @JsonKey(name: 'depth_units') int depthUnits,
      @JsonKey(name: 'label_text') String? labelText});
}

/// @nodoc
class _$BinCreateRequestCopyWithImpl<$Res, $Val extends BinCreateRequest>
    implements $BinCreateRequestCopyWith<$Res> {
  _$BinCreateRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BinCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? xGrid = null,
    Object? yGrid = null,
    Object? widthUnits = null,
    Object? depthUnits = null,
    Object? labelText = freezed,
  }) {
    return _then(_value.copyWith(
      xGrid: null == xGrid
          ? _value.xGrid
          : xGrid // ignore: cast_nullable_to_non_nullable
              as int,
      yGrid: null == yGrid
          ? _value.yGrid
          : yGrid // ignore: cast_nullable_to_non_nullable
              as int,
      widthUnits: null == widthUnits
          ? _value.widthUnits
          : widthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      depthUnits: null == depthUnits
          ? _value.depthUnits
          : depthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      labelText: freezed == labelText
          ? _value.labelText
          : labelText // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BinCreateRequestImplCopyWith<$Res>
    implements $BinCreateRequestCopyWith<$Res> {
  factory _$$BinCreateRequestImplCopyWith(_$BinCreateRequestImpl value,
          $Res Function(_$BinCreateRequestImpl) then) =
      __$$BinCreateRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'x_grid') int xGrid,
      @JsonKey(name: 'y_grid') int yGrid,
      @JsonKey(name: 'width_units') int widthUnits,
      @JsonKey(name: 'depth_units') int depthUnits,
      @JsonKey(name: 'label_text') String? labelText});
}

/// @nodoc
class __$$BinCreateRequestImplCopyWithImpl<$Res>
    extends _$BinCreateRequestCopyWithImpl<$Res, _$BinCreateRequestImpl>
    implements _$$BinCreateRequestImplCopyWith<$Res> {
  __$$BinCreateRequestImplCopyWithImpl(_$BinCreateRequestImpl _value,
      $Res Function(_$BinCreateRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of BinCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? xGrid = null,
    Object? yGrid = null,
    Object? widthUnits = null,
    Object? depthUnits = null,
    Object? labelText = freezed,
  }) {
    return _then(_$BinCreateRequestImpl(
      xGrid: null == xGrid
          ? _value.xGrid
          : xGrid // ignore: cast_nullable_to_non_nullable
              as int,
      yGrid: null == yGrid
          ? _value.yGrid
          : yGrid // ignore: cast_nullable_to_non_nullable
              as int,
      widthUnits: null == widthUnits
          ? _value.widthUnits
          : widthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      depthUnits: null == depthUnits
          ? _value.depthUnits
          : depthUnits // ignore: cast_nullable_to_non_nullable
              as int,
      labelText: freezed == labelText
          ? _value.labelText
          : labelText // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BinCreateRequestImpl implements _BinCreateRequest {
  const _$BinCreateRequestImpl(
      {@JsonKey(name: 'x_grid') required this.xGrid,
      @JsonKey(name: 'y_grid') required this.yGrid,
      @JsonKey(name: 'width_units') required this.widthUnits,
      @JsonKey(name: 'depth_units') required this.depthUnits,
      @JsonKey(name: 'label_text') this.labelText});

  factory _$BinCreateRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$BinCreateRequestImplFromJson(json);

  @override
  @JsonKey(name: 'x_grid')
  final int xGrid;
  @override
  @JsonKey(name: 'y_grid')
  final int yGrid;
  @override
  @JsonKey(name: 'width_units')
  final int widthUnits;
  @override
  @JsonKey(name: 'depth_units')
  final int depthUnits;
  @override
  @JsonKey(name: 'label_text')
  final String? labelText;

  @override
  String toString() {
    return 'BinCreateRequest(xGrid: $xGrid, yGrid: $yGrid, widthUnits: $widthUnits, depthUnits: $depthUnits, labelText: $labelText)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BinCreateRequestImpl &&
            (identical(other.xGrid, xGrid) || other.xGrid == xGrid) &&
            (identical(other.yGrid, yGrid) || other.yGrid == yGrid) &&
            (identical(other.widthUnits, widthUnits) ||
                other.widthUnits == widthUnits) &&
            (identical(other.depthUnits, depthUnits) ||
                other.depthUnits == depthUnits) &&
            (identical(other.labelText, labelText) ||
                other.labelText == labelText));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, xGrid, yGrid, widthUnits, depthUnits, labelText);

  /// Create a copy of BinCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BinCreateRequestImplCopyWith<_$BinCreateRequestImpl> get copyWith =>
      __$$BinCreateRequestImplCopyWithImpl<_$BinCreateRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BinCreateRequestImplToJson(
      this,
    );
  }
}

abstract class _BinCreateRequest implements BinCreateRequest {
  const factory _BinCreateRequest(
          {@JsonKey(name: 'x_grid') required final int xGrid,
          @JsonKey(name: 'y_grid') required final int yGrid,
          @JsonKey(name: 'width_units') required final int widthUnits,
          @JsonKey(name: 'depth_units') required final int depthUnits,
          @JsonKey(name: 'label_text') final String? labelText}) =
      _$BinCreateRequestImpl;

  factory _BinCreateRequest.fromJson(Map<String, dynamic> json) =
      _$BinCreateRequestImpl.fromJson;

  @override
  @JsonKey(name: 'x_grid')
  int get xGrid;
  @override
  @JsonKey(name: 'y_grid')
  int get yGrid;
  @override
  @JsonKey(name: 'width_units')
  int get widthUnits;
  @override
  @JsonKey(name: 'depth_units')
  int get depthUnits;
  @override
  @JsonKey(name: 'label_text')
  String? get labelText;

  /// Create a copy of BinCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BinCreateRequestImplCopyWith<_$BinCreateRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BinUpdateRequest _$BinUpdateRequestFromJson(Map<String, dynamic> json) {
  return _BinUpdateRequest.fromJson(json);
}

/// @nodoc
mixin _$BinUpdateRequest {
  @JsonKey(name: 'x_grid')
  int? get xGrid => throw _privateConstructorUsedError;
  @JsonKey(name: 'y_grid')
  int? get yGrid => throw _privateConstructorUsedError;
  @JsonKey(name: 'width_units')
  int? get widthUnits => throw _privateConstructorUsedError;
  @JsonKey(name: 'depth_units')
  int? get depthUnits => throw _privateConstructorUsedError;
  @JsonKey(name: 'label_text')
  String? get labelText => throw _privateConstructorUsedError;

  /// Serializes this BinUpdateRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of BinUpdateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BinUpdateRequestCopyWith<BinUpdateRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BinUpdateRequestCopyWith<$Res> {
  factory $BinUpdateRequestCopyWith(
          BinUpdateRequest value, $Res Function(BinUpdateRequest) then) =
      _$BinUpdateRequestCopyWithImpl<$Res, BinUpdateRequest>;
  @useResult
  $Res call(
      {@JsonKey(name: 'x_grid') int? xGrid,
      @JsonKey(name: 'y_grid') int? yGrid,
      @JsonKey(name: 'width_units') int? widthUnits,
      @JsonKey(name: 'depth_units') int? depthUnits,
      @JsonKey(name: 'label_text') String? labelText});
}

/// @nodoc
class _$BinUpdateRequestCopyWithImpl<$Res, $Val extends BinUpdateRequest>
    implements $BinUpdateRequestCopyWith<$Res> {
  _$BinUpdateRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BinUpdateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? xGrid = freezed,
    Object? yGrid = freezed,
    Object? widthUnits = freezed,
    Object? depthUnits = freezed,
    Object? labelText = freezed,
  }) {
    return _then(_value.copyWith(
      xGrid: freezed == xGrid
          ? _value.xGrid
          : xGrid // ignore: cast_nullable_to_non_nullable
              as int?,
      yGrid: freezed == yGrid
          ? _value.yGrid
          : yGrid // ignore: cast_nullable_to_non_nullable
              as int?,
      widthUnits: freezed == widthUnits
          ? _value.widthUnits
          : widthUnits // ignore: cast_nullable_to_non_nullable
              as int?,
      depthUnits: freezed == depthUnits
          ? _value.depthUnits
          : depthUnits // ignore: cast_nullable_to_non_nullable
              as int?,
      labelText: freezed == labelText
          ? _value.labelText
          : labelText // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BinUpdateRequestImplCopyWith<$Res>
    implements $BinUpdateRequestCopyWith<$Res> {
  factory _$$BinUpdateRequestImplCopyWith(_$BinUpdateRequestImpl value,
          $Res Function(_$BinUpdateRequestImpl) then) =
      __$$BinUpdateRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'x_grid') int? xGrid,
      @JsonKey(name: 'y_grid') int? yGrid,
      @JsonKey(name: 'width_units') int? widthUnits,
      @JsonKey(name: 'depth_units') int? depthUnits,
      @JsonKey(name: 'label_text') String? labelText});
}

/// @nodoc
class __$$BinUpdateRequestImplCopyWithImpl<$Res>
    extends _$BinUpdateRequestCopyWithImpl<$Res, _$BinUpdateRequestImpl>
    implements _$$BinUpdateRequestImplCopyWith<$Res> {
  __$$BinUpdateRequestImplCopyWithImpl(_$BinUpdateRequestImpl _value,
      $Res Function(_$BinUpdateRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of BinUpdateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? xGrid = freezed,
    Object? yGrid = freezed,
    Object? widthUnits = freezed,
    Object? depthUnits = freezed,
    Object? labelText = freezed,
  }) {
    return _then(_$BinUpdateRequestImpl(
      xGrid: freezed == xGrid
          ? _value.xGrid
          : xGrid // ignore: cast_nullable_to_non_nullable
              as int?,
      yGrid: freezed == yGrid
          ? _value.yGrid
          : yGrid // ignore: cast_nullable_to_non_nullable
              as int?,
      widthUnits: freezed == widthUnits
          ? _value.widthUnits
          : widthUnits // ignore: cast_nullable_to_non_nullable
              as int?,
      depthUnits: freezed == depthUnits
          ? _value.depthUnits
          : depthUnits // ignore: cast_nullable_to_non_nullable
              as int?,
      labelText: freezed == labelText
          ? _value.labelText
          : labelText // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BinUpdateRequestImpl implements _BinUpdateRequest {
  const _$BinUpdateRequestImpl(
      {@JsonKey(name: 'x_grid') this.xGrid,
      @JsonKey(name: 'y_grid') this.yGrid,
      @JsonKey(name: 'width_units') this.widthUnits,
      @JsonKey(name: 'depth_units') this.depthUnits,
      @JsonKey(name: 'label_text') this.labelText});

  factory _$BinUpdateRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$BinUpdateRequestImplFromJson(json);

  @override
  @JsonKey(name: 'x_grid')
  final int? xGrid;
  @override
  @JsonKey(name: 'y_grid')
  final int? yGrid;
  @override
  @JsonKey(name: 'width_units')
  final int? widthUnits;
  @override
  @JsonKey(name: 'depth_units')
  final int? depthUnits;
  @override
  @JsonKey(name: 'label_text')
  final String? labelText;

  @override
  String toString() {
    return 'BinUpdateRequest(xGrid: $xGrid, yGrid: $yGrid, widthUnits: $widthUnits, depthUnits: $depthUnits, labelText: $labelText)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BinUpdateRequestImpl &&
            (identical(other.xGrid, xGrid) || other.xGrid == xGrid) &&
            (identical(other.yGrid, yGrid) || other.yGrid == yGrid) &&
            (identical(other.widthUnits, widthUnits) ||
                other.widthUnits == widthUnits) &&
            (identical(other.depthUnits, depthUnits) ||
                other.depthUnits == depthUnits) &&
            (identical(other.labelText, labelText) ||
                other.labelText == labelText));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, xGrid, yGrid, widthUnits, depthUnits, labelText);

  /// Create a copy of BinUpdateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BinUpdateRequestImplCopyWith<_$BinUpdateRequestImpl> get copyWith =>
      __$$BinUpdateRequestImplCopyWithImpl<_$BinUpdateRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BinUpdateRequestImplToJson(
      this,
    );
  }
}

abstract class _BinUpdateRequest implements BinUpdateRequest {
  const factory _BinUpdateRequest(
          {@JsonKey(name: 'x_grid') final int? xGrid,
          @JsonKey(name: 'y_grid') final int? yGrid,
          @JsonKey(name: 'width_units') final int? widthUnits,
          @JsonKey(name: 'depth_units') final int? depthUnits,
          @JsonKey(name: 'label_text') final String? labelText}) =
      _$BinUpdateRequestImpl;

  factory _BinUpdateRequest.fromJson(Map<String, dynamic> json) =
      _$BinUpdateRequestImpl.fromJson;

  @override
  @JsonKey(name: 'x_grid')
  int? get xGrid;
  @override
  @JsonKey(name: 'y_grid')
  int? get yGrid;
  @override
  @JsonKey(name: 'width_units')
  int? get widthUnits;
  @override
  @JsonKey(name: 'depth_units')
  int? get depthUnits;
  @override
  @JsonKey(name: 'label_text')
  String? get labelText;

  /// Create a copy of BinUpdateRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BinUpdateRequestImplCopyWith<_$BinUpdateRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

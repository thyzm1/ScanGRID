// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'layer.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Layer _$LayerFromJson(Map<String, dynamic> json) {
  return _Layer.fromJson(json);
}

/// @nodoc
mixin _$Layer {
  /// ID unique (généré par le serveur, optionnel côté client)
  @JsonKey(name: 'layer_id')
  String? get layerId => throw _privateConstructorUsedError;

  /// Index de hauteur (0 = fond, 1 = au-dessus, etc.)
  @JsonKey(name: 'z_index')
  int get zIndex => throw _privateConstructorUsedError;

  /// Liste des boîtes sur cette couche
  List<Bin> get bins => throw _privateConstructorUsedError;

  /// Serializes this Layer to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Layer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $LayerCopyWith<Layer> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LayerCopyWith<$Res> {
  factory $LayerCopyWith(Layer value, $Res Function(Layer) then) =
      _$LayerCopyWithImpl<$Res, Layer>;
  @useResult
  $Res call(
      {@JsonKey(name: 'layer_id') String? layerId,
      @JsonKey(name: 'z_index') int zIndex,
      List<Bin> bins});
}

/// @nodoc
class _$LayerCopyWithImpl<$Res, $Val extends Layer>
    implements $LayerCopyWith<$Res> {
  _$LayerCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Layer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? layerId = freezed,
    Object? zIndex = null,
    Object? bins = null,
  }) {
    return _then(_value.copyWith(
      layerId: freezed == layerId
          ? _value.layerId
          : layerId // ignore: cast_nullable_to_non_nullable
              as String?,
      zIndex: null == zIndex
          ? _value.zIndex
          : zIndex // ignore: cast_nullable_to_non_nullable
              as int,
      bins: null == bins
          ? _value.bins
          : bins // ignore: cast_nullable_to_non_nullable
              as List<Bin>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LayerImplCopyWith<$Res> implements $LayerCopyWith<$Res> {
  factory _$$LayerImplCopyWith(
          _$LayerImpl value, $Res Function(_$LayerImpl) then) =
      __$$LayerImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'layer_id') String? layerId,
      @JsonKey(name: 'z_index') int zIndex,
      List<Bin> bins});
}

/// @nodoc
class __$$LayerImplCopyWithImpl<$Res>
    extends _$LayerCopyWithImpl<$Res, _$LayerImpl>
    implements _$$LayerImplCopyWith<$Res> {
  __$$LayerImplCopyWithImpl(
      _$LayerImpl _value, $Res Function(_$LayerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Layer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? layerId = freezed,
    Object? zIndex = null,
    Object? bins = null,
  }) {
    return _then(_$LayerImpl(
      layerId: freezed == layerId
          ? _value.layerId
          : layerId // ignore: cast_nullable_to_non_nullable
              as String?,
      zIndex: null == zIndex
          ? _value.zIndex
          : zIndex // ignore: cast_nullable_to_non_nullable
              as int,
      bins: null == bins
          ? _value._bins
          : bins // ignore: cast_nullable_to_non_nullable
              as List<Bin>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LayerImpl implements _Layer {
  const _$LayerImpl(
      {@JsonKey(name: 'layer_id') this.layerId,
      @JsonKey(name: 'z_index') required this.zIndex,
      final List<Bin> bins = const []})
      : _bins = bins;

  factory _$LayerImpl.fromJson(Map<String, dynamic> json) =>
      _$$LayerImplFromJson(json);

  /// ID unique (généré par le serveur, optionnel côté client)
  @override
  @JsonKey(name: 'layer_id')
  final String? layerId;

  /// Index de hauteur (0 = fond, 1 = au-dessus, etc.)
  @override
  @JsonKey(name: 'z_index')
  final int zIndex;

  /// Liste des boîtes sur cette couche
  final List<Bin> _bins;

  /// Liste des boîtes sur cette couche
  @override
  @JsonKey()
  List<Bin> get bins {
    if (_bins is EqualUnmodifiableListView) return _bins;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bins);
  }

  @override
  String toString() {
    return 'Layer(layerId: $layerId, zIndex: $zIndex, bins: $bins)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LayerImpl &&
            (identical(other.layerId, layerId) || other.layerId == layerId) &&
            (identical(other.zIndex, zIndex) || other.zIndex == zIndex) &&
            const DeepCollectionEquality().equals(other._bins, _bins));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, layerId, zIndex, const DeepCollectionEquality().hash(_bins));

  /// Create a copy of Layer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$LayerImplCopyWith<_$LayerImpl> get copyWith =>
      __$$LayerImplCopyWithImpl<_$LayerImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LayerImplToJson(
      this,
    );
  }
}

abstract class _Layer implements Layer {
  const factory _Layer(
      {@JsonKey(name: 'layer_id') final String? layerId,
      @JsonKey(name: 'z_index') required final int zIndex,
      final List<Bin> bins}) = _$LayerImpl;

  factory _Layer.fromJson(Map<String, dynamic> json) = _$LayerImpl.fromJson;

  /// ID unique (généré par le serveur, optionnel côté client)
  @override
  @JsonKey(name: 'layer_id')
  String? get layerId;

  /// Index de hauteur (0 = fond, 1 = au-dessus, etc.)
  @override
  @JsonKey(name: 'z_index')
  int get zIndex;

  /// Liste des boîtes sur cette couche
  @override
  List<Bin> get bins;

  /// Create a copy of Layer
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$LayerImplCopyWith<_$LayerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

LayerCreateRequest _$LayerCreateRequestFromJson(Map<String, dynamic> json) {
  return _LayerCreateRequest.fromJson(json);
}

/// @nodoc
mixin _$LayerCreateRequest {
  @JsonKey(name: 'z_index')
  int get zIndex => throw _privateConstructorUsedError;
  List<BinCreateRequest> get bins => throw _privateConstructorUsedError;

  /// Serializes this LayerCreateRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of LayerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $LayerCreateRequestCopyWith<LayerCreateRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LayerCreateRequestCopyWith<$Res> {
  factory $LayerCreateRequestCopyWith(
          LayerCreateRequest value, $Res Function(LayerCreateRequest) then) =
      _$LayerCreateRequestCopyWithImpl<$Res, LayerCreateRequest>;
  @useResult
  $Res call(
      {@JsonKey(name: 'z_index') int zIndex, List<BinCreateRequest> bins});
}

/// @nodoc
class _$LayerCreateRequestCopyWithImpl<$Res, $Val extends LayerCreateRequest>
    implements $LayerCreateRequestCopyWith<$Res> {
  _$LayerCreateRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of LayerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? zIndex = null,
    Object? bins = null,
  }) {
    return _then(_value.copyWith(
      zIndex: null == zIndex
          ? _value.zIndex
          : zIndex // ignore: cast_nullable_to_non_nullable
              as int,
      bins: null == bins
          ? _value.bins
          : bins // ignore: cast_nullable_to_non_nullable
              as List<BinCreateRequest>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LayerCreateRequestImplCopyWith<$Res>
    implements $LayerCreateRequestCopyWith<$Res> {
  factory _$$LayerCreateRequestImplCopyWith(_$LayerCreateRequestImpl value,
          $Res Function(_$LayerCreateRequestImpl) then) =
      __$$LayerCreateRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'z_index') int zIndex, List<BinCreateRequest> bins});
}

/// @nodoc
class __$$LayerCreateRequestImplCopyWithImpl<$Res>
    extends _$LayerCreateRequestCopyWithImpl<$Res, _$LayerCreateRequestImpl>
    implements _$$LayerCreateRequestImplCopyWith<$Res> {
  __$$LayerCreateRequestImplCopyWithImpl(_$LayerCreateRequestImpl _value,
      $Res Function(_$LayerCreateRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of LayerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? zIndex = null,
    Object? bins = null,
  }) {
    return _then(_$LayerCreateRequestImpl(
      zIndex: null == zIndex
          ? _value.zIndex
          : zIndex // ignore: cast_nullable_to_non_nullable
              as int,
      bins: null == bins
          ? _value._bins
          : bins // ignore: cast_nullable_to_non_nullable
              as List<BinCreateRequest>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LayerCreateRequestImpl implements _LayerCreateRequest {
  const _$LayerCreateRequestImpl(
      {@JsonKey(name: 'z_index') required this.zIndex,
      final List<BinCreateRequest> bins = const []})
      : _bins = bins;

  factory _$LayerCreateRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$LayerCreateRequestImplFromJson(json);

  @override
  @JsonKey(name: 'z_index')
  final int zIndex;
  final List<BinCreateRequest> _bins;
  @override
  @JsonKey()
  List<BinCreateRequest> get bins {
    if (_bins is EqualUnmodifiableListView) return _bins;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_bins);
  }

  @override
  String toString() {
    return 'LayerCreateRequest(zIndex: $zIndex, bins: $bins)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LayerCreateRequestImpl &&
            (identical(other.zIndex, zIndex) || other.zIndex == zIndex) &&
            const DeepCollectionEquality().equals(other._bins, _bins));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, zIndex, const DeepCollectionEquality().hash(_bins));

  /// Create a copy of LayerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$LayerCreateRequestImplCopyWith<_$LayerCreateRequestImpl> get copyWith =>
      __$$LayerCreateRequestImplCopyWithImpl<_$LayerCreateRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LayerCreateRequestImplToJson(
      this,
    );
  }
}

abstract class _LayerCreateRequest implements LayerCreateRequest {
  const factory _LayerCreateRequest(
      {@JsonKey(name: 'z_index') required final int zIndex,
      final List<BinCreateRequest> bins}) = _$LayerCreateRequestImpl;

  factory _LayerCreateRequest.fromJson(Map<String, dynamic> json) =
      _$LayerCreateRequestImpl.fromJson;

  @override
  @JsonKey(name: 'z_index')
  int get zIndex;
  @override
  List<BinCreateRequest> get bins;

  /// Create a copy of LayerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$LayerCreateRequestImplCopyWith<_$LayerCreateRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

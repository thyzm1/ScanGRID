// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'drawer.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Drawer _$DrawerFromJson(Map<String, dynamic> json) {
  return _Drawer.fromJson(json);
}

/// @nodoc
mixin _$Drawer {
  /// ID unique (généré par le serveur, optionnel côté client)
  @JsonKey(name: 'drawer_id')
  String? get drawerId => throw _privateConstructorUsedError;

  /// Nom du tiroir
  String get name => throw _privateConstructorUsedError;

  /// Liste des couches du tiroir
  List<Layer> get layers => throw _privateConstructorUsedError;

  /// Serializes this Drawer to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Drawer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DrawerCopyWith<Drawer> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DrawerCopyWith<$Res> {
  factory $DrawerCopyWith(Drawer value, $Res Function(Drawer) then) =
      _$DrawerCopyWithImpl<$Res, Drawer>;
  @useResult
  $Res call(
      {@JsonKey(name: 'drawer_id') String? drawerId,
      String name,
      List<Layer> layers});
}

/// @nodoc
class _$DrawerCopyWithImpl<$Res, $Val extends Drawer>
    implements $DrawerCopyWith<$Res> {
  _$DrawerCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Drawer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? drawerId = freezed,
    Object? name = null,
    Object? layers = null,
  }) {
    return _then(_value.copyWith(
      drawerId: freezed == drawerId
          ? _value.drawerId
          : drawerId // ignore: cast_nullable_to_non_nullable
              as String?,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      layers: null == layers
          ? _value.layers
          : layers // ignore: cast_nullable_to_non_nullable
              as List<Layer>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DrawerImplCopyWith<$Res> implements $DrawerCopyWith<$Res> {
  factory _$$DrawerImplCopyWith(
          _$DrawerImpl value, $Res Function(_$DrawerImpl) then) =
      __$$DrawerImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'drawer_id') String? drawerId,
      String name,
      List<Layer> layers});
}

/// @nodoc
class __$$DrawerImplCopyWithImpl<$Res>
    extends _$DrawerCopyWithImpl<$Res, _$DrawerImpl>
    implements _$$DrawerImplCopyWith<$Res> {
  __$$DrawerImplCopyWithImpl(
      _$DrawerImpl _value, $Res Function(_$DrawerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Drawer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? drawerId = freezed,
    Object? name = null,
    Object? layers = null,
  }) {
    return _then(_$DrawerImpl(
      drawerId: freezed == drawerId
          ? _value.drawerId
          : drawerId // ignore: cast_nullable_to_non_nullable
              as String?,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      layers: null == layers
          ? _value._layers
          : layers // ignore: cast_nullable_to_non_nullable
              as List<Layer>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$DrawerImpl implements _Drawer {
  const _$DrawerImpl(
      {@JsonKey(name: 'drawer_id') this.drawerId,
      required this.name,
      final List<Layer> layers = const []})
      : _layers = layers;

  factory _$DrawerImpl.fromJson(Map<String, dynamic> json) =>
      _$$DrawerImplFromJson(json);

  /// ID unique (généré par le serveur, optionnel côté client)
  @override
  @JsonKey(name: 'drawer_id')
  final String? drawerId;

  /// Nom du tiroir
  @override
  final String name;

  /// Liste des couches du tiroir
  final List<Layer> _layers;

  /// Liste des couches du tiroir
  @override
  @JsonKey()
  List<Layer> get layers {
    if (_layers is EqualUnmodifiableListView) return _layers;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_layers);
  }

  @override
  String toString() {
    return 'Drawer(drawerId: $drawerId, name: $name, layers: $layers)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DrawerImpl &&
            (identical(other.drawerId, drawerId) ||
                other.drawerId == drawerId) &&
            (identical(other.name, name) || other.name == name) &&
            const DeepCollectionEquality().equals(other._layers, _layers));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, drawerId, name,
      const DeepCollectionEquality().hash(_layers));

  /// Create a copy of Drawer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DrawerImplCopyWith<_$DrawerImpl> get copyWith =>
      __$$DrawerImplCopyWithImpl<_$DrawerImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DrawerImplToJson(
      this,
    );
  }
}

abstract class _Drawer implements Drawer {
  const factory _Drawer(
      {@JsonKey(name: 'drawer_id') final String? drawerId,
      required final String name,
      final List<Layer> layers}) = _$DrawerImpl;

  factory _Drawer.fromJson(Map<String, dynamic> json) = _$DrawerImpl.fromJson;

  /// ID unique (généré par le serveur, optionnel côté client)
  @override
  @JsonKey(name: 'drawer_id')
  String? get drawerId;

  /// Nom du tiroir
  @override
  String get name;

  /// Liste des couches du tiroir
  @override
  List<Layer> get layers;

  /// Create a copy of Drawer
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DrawerImplCopyWith<_$DrawerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

DrawerCreateRequest _$DrawerCreateRequestFromJson(Map<String, dynamic> json) {
  return _DrawerCreateRequest.fromJson(json);
}

/// @nodoc
mixin _$DrawerCreateRequest {
  String get name => throw _privateConstructorUsedError;
  List<LayerCreateRequest> get layers => throw _privateConstructorUsedError;

  /// Serializes this DrawerCreateRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DrawerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DrawerCreateRequestCopyWith<DrawerCreateRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DrawerCreateRequestCopyWith<$Res> {
  factory $DrawerCreateRequestCopyWith(
          DrawerCreateRequest value, $Res Function(DrawerCreateRequest) then) =
      _$DrawerCreateRequestCopyWithImpl<$Res, DrawerCreateRequest>;
  @useResult
  $Res call({String name, List<LayerCreateRequest> layers});
}

/// @nodoc
class _$DrawerCreateRequestCopyWithImpl<$Res, $Val extends DrawerCreateRequest>
    implements $DrawerCreateRequestCopyWith<$Res> {
  _$DrawerCreateRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DrawerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? layers = null,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      layers: null == layers
          ? _value.layers
          : layers // ignore: cast_nullable_to_non_nullable
              as List<LayerCreateRequest>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DrawerCreateRequestImplCopyWith<$Res>
    implements $DrawerCreateRequestCopyWith<$Res> {
  factory _$$DrawerCreateRequestImplCopyWith(_$DrawerCreateRequestImpl value,
          $Res Function(_$DrawerCreateRequestImpl) then) =
      __$$DrawerCreateRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, List<LayerCreateRequest> layers});
}

/// @nodoc
class __$$DrawerCreateRequestImplCopyWithImpl<$Res>
    extends _$DrawerCreateRequestCopyWithImpl<$Res, _$DrawerCreateRequestImpl>
    implements _$$DrawerCreateRequestImplCopyWith<$Res> {
  __$$DrawerCreateRequestImplCopyWithImpl(_$DrawerCreateRequestImpl _value,
      $Res Function(_$DrawerCreateRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of DrawerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? layers = null,
  }) {
    return _then(_$DrawerCreateRequestImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      layers: null == layers
          ? _value._layers
          : layers // ignore: cast_nullable_to_non_nullable
              as List<LayerCreateRequest>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$DrawerCreateRequestImpl implements _DrawerCreateRequest {
  const _$DrawerCreateRequestImpl(
      {required this.name, final List<LayerCreateRequest> layers = const []})
      : _layers = layers;

  factory _$DrawerCreateRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$DrawerCreateRequestImplFromJson(json);

  @override
  final String name;
  final List<LayerCreateRequest> _layers;
  @override
  @JsonKey()
  List<LayerCreateRequest> get layers {
    if (_layers is EqualUnmodifiableListView) return _layers;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_layers);
  }

  @override
  String toString() {
    return 'DrawerCreateRequest(name: $name, layers: $layers)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DrawerCreateRequestImpl &&
            (identical(other.name, name) || other.name == name) &&
            const DeepCollectionEquality().equals(other._layers, _layers));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, name, const DeepCollectionEquality().hash(_layers));

  /// Create a copy of DrawerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DrawerCreateRequestImplCopyWith<_$DrawerCreateRequestImpl> get copyWith =>
      __$$DrawerCreateRequestImplCopyWithImpl<_$DrawerCreateRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DrawerCreateRequestImplToJson(
      this,
    );
  }
}

abstract class _DrawerCreateRequest implements DrawerCreateRequest {
  const factory _DrawerCreateRequest(
      {required final String name,
      final List<LayerCreateRequest> layers}) = _$DrawerCreateRequestImpl;

  factory _DrawerCreateRequest.fromJson(Map<String, dynamic> json) =
      _$DrawerCreateRequestImpl.fromJson;

  @override
  String get name;
  @override
  List<LayerCreateRequest> get layers;

  /// Create a copy of DrawerCreateRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DrawerCreateRequestImplCopyWith<_$DrawerCreateRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

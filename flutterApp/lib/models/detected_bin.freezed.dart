// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'detected_bin.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$DetectedBin {
  /// Coordonnées et dimensions dans la grille
  int get xGrid => throw _privateConstructorUsedError;
  int get yGrid => throw _privateConstructorUsedError;
  int get widthUnits => throw _privateConstructorUsedError;
  int get depthUnits => throw _privateConstructorUsedError;

  /// Texte détecté par OCR
  String? get labelText => throw _privateConstructorUsedError;

  /// Niveau de confiance OCR (0.0 à 1.0)
  double get ocrConfidence => throw _privateConstructorUsedError;

  /// Coordonnées en pixels (pour le CustomPaint)
  double get pixelX => throw _privateConstructorUsedError;
  double get pixelY => throw _privateConstructorUsedError;
  double get pixelWidth => throw _privateConstructorUsedError;
  double get pixelHeight => throw _privateConstructorUsedError;

  /// Flag indiquant si c'est un "trou" (détecté sur couche supérieure)
  bool get isHole => throw _privateConstructorUsedError;

  /// Référence à la boîte de la couche inférieure (si isHole = true)
  String? get underlyingBinText => throw _privateConstructorUsedError;

  /// Create a copy of DetectedBin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DetectedBinCopyWith<DetectedBin> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DetectedBinCopyWith<$Res> {
  factory $DetectedBinCopyWith(
          DetectedBin value, $Res Function(DetectedBin) then) =
      _$DetectedBinCopyWithImpl<$Res, DetectedBin>;
  @useResult
  $Res call(
      {int xGrid,
      int yGrid,
      int widthUnits,
      int depthUnits,
      String? labelText,
      double ocrConfidence,
      double pixelX,
      double pixelY,
      double pixelWidth,
      double pixelHeight,
      bool isHole,
      String? underlyingBinText});
}

/// @nodoc
class _$DetectedBinCopyWithImpl<$Res, $Val extends DetectedBin>
    implements $DetectedBinCopyWith<$Res> {
  _$DetectedBinCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DetectedBin
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? xGrid = null,
    Object? yGrid = null,
    Object? widthUnits = null,
    Object? depthUnits = null,
    Object? labelText = freezed,
    Object? ocrConfidence = null,
    Object? pixelX = null,
    Object? pixelY = null,
    Object? pixelWidth = null,
    Object? pixelHeight = null,
    Object? isHole = null,
    Object? underlyingBinText = freezed,
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
      ocrConfidence: null == ocrConfidence
          ? _value.ocrConfidence
          : ocrConfidence // ignore: cast_nullable_to_non_nullable
              as double,
      pixelX: null == pixelX
          ? _value.pixelX
          : pixelX // ignore: cast_nullable_to_non_nullable
              as double,
      pixelY: null == pixelY
          ? _value.pixelY
          : pixelY // ignore: cast_nullable_to_non_nullable
              as double,
      pixelWidth: null == pixelWidth
          ? _value.pixelWidth
          : pixelWidth // ignore: cast_nullable_to_non_nullable
              as double,
      pixelHeight: null == pixelHeight
          ? _value.pixelHeight
          : pixelHeight // ignore: cast_nullable_to_non_nullable
              as double,
      isHole: null == isHole
          ? _value.isHole
          : isHole // ignore: cast_nullable_to_non_nullable
              as bool,
      underlyingBinText: freezed == underlyingBinText
          ? _value.underlyingBinText
          : underlyingBinText // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DetectedBinImplCopyWith<$Res>
    implements $DetectedBinCopyWith<$Res> {
  factory _$$DetectedBinImplCopyWith(
          _$DetectedBinImpl value, $Res Function(_$DetectedBinImpl) then) =
      __$$DetectedBinImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int xGrid,
      int yGrid,
      int widthUnits,
      int depthUnits,
      String? labelText,
      double ocrConfidence,
      double pixelX,
      double pixelY,
      double pixelWidth,
      double pixelHeight,
      bool isHole,
      String? underlyingBinText});
}

/// @nodoc
class __$$DetectedBinImplCopyWithImpl<$Res>
    extends _$DetectedBinCopyWithImpl<$Res, _$DetectedBinImpl>
    implements _$$DetectedBinImplCopyWith<$Res> {
  __$$DetectedBinImplCopyWithImpl(
      _$DetectedBinImpl _value, $Res Function(_$DetectedBinImpl) _then)
      : super(_value, _then);

  /// Create a copy of DetectedBin
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? xGrid = null,
    Object? yGrid = null,
    Object? widthUnits = null,
    Object? depthUnits = null,
    Object? labelText = freezed,
    Object? ocrConfidence = null,
    Object? pixelX = null,
    Object? pixelY = null,
    Object? pixelWidth = null,
    Object? pixelHeight = null,
    Object? isHole = null,
    Object? underlyingBinText = freezed,
  }) {
    return _then(_$DetectedBinImpl(
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
      ocrConfidence: null == ocrConfidence
          ? _value.ocrConfidence
          : ocrConfidence // ignore: cast_nullable_to_non_nullable
              as double,
      pixelX: null == pixelX
          ? _value.pixelX
          : pixelX // ignore: cast_nullable_to_non_nullable
              as double,
      pixelY: null == pixelY
          ? _value.pixelY
          : pixelY // ignore: cast_nullable_to_non_nullable
              as double,
      pixelWidth: null == pixelWidth
          ? _value.pixelWidth
          : pixelWidth // ignore: cast_nullable_to_non_nullable
              as double,
      pixelHeight: null == pixelHeight
          ? _value.pixelHeight
          : pixelHeight // ignore: cast_nullable_to_non_nullable
              as double,
      isHole: null == isHole
          ? _value.isHole
          : isHole // ignore: cast_nullable_to_non_nullable
              as bool,
      underlyingBinText: freezed == underlyingBinText
          ? _value.underlyingBinText
          : underlyingBinText // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$DetectedBinImpl extends _DetectedBin {
  const _$DetectedBinImpl(
      {required this.xGrid,
      required this.yGrid,
      required this.widthUnits,
      required this.depthUnits,
      this.labelText,
      this.ocrConfidence = 0.0,
      required this.pixelX,
      required this.pixelY,
      required this.pixelWidth,
      required this.pixelHeight,
      this.isHole = false,
      this.underlyingBinText})
      : super._();

  /// Coordonnées et dimensions dans la grille
  @override
  final int xGrid;
  @override
  final int yGrid;
  @override
  final int widthUnits;
  @override
  final int depthUnits;

  /// Texte détecté par OCR
  @override
  final String? labelText;

  /// Niveau de confiance OCR (0.0 à 1.0)
  @override
  @JsonKey()
  final double ocrConfidence;

  /// Coordonnées en pixels (pour le CustomPaint)
  @override
  final double pixelX;
  @override
  final double pixelY;
  @override
  final double pixelWidth;
  @override
  final double pixelHeight;

  /// Flag indiquant si c'est un "trou" (détecté sur couche supérieure)
  @override
  @JsonKey()
  final bool isHole;

  /// Référence à la boîte de la couche inférieure (si isHole = true)
  @override
  final String? underlyingBinText;

  @override
  String toString() {
    return 'DetectedBin(xGrid: $xGrid, yGrid: $yGrid, widthUnits: $widthUnits, depthUnits: $depthUnits, labelText: $labelText, ocrConfidence: $ocrConfidence, pixelX: $pixelX, pixelY: $pixelY, pixelWidth: $pixelWidth, pixelHeight: $pixelHeight, isHole: $isHole, underlyingBinText: $underlyingBinText)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DetectedBinImpl &&
            (identical(other.xGrid, xGrid) || other.xGrid == xGrid) &&
            (identical(other.yGrid, yGrid) || other.yGrid == yGrid) &&
            (identical(other.widthUnits, widthUnits) ||
                other.widthUnits == widthUnits) &&
            (identical(other.depthUnits, depthUnits) ||
                other.depthUnits == depthUnits) &&
            (identical(other.labelText, labelText) ||
                other.labelText == labelText) &&
            (identical(other.ocrConfidence, ocrConfidence) ||
                other.ocrConfidence == ocrConfidence) &&
            (identical(other.pixelX, pixelX) || other.pixelX == pixelX) &&
            (identical(other.pixelY, pixelY) || other.pixelY == pixelY) &&
            (identical(other.pixelWidth, pixelWidth) ||
                other.pixelWidth == pixelWidth) &&
            (identical(other.pixelHeight, pixelHeight) ||
                other.pixelHeight == pixelHeight) &&
            (identical(other.isHole, isHole) || other.isHole == isHole) &&
            (identical(other.underlyingBinText, underlyingBinText) ||
                other.underlyingBinText == underlyingBinText));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      xGrid,
      yGrid,
      widthUnits,
      depthUnits,
      labelText,
      ocrConfidence,
      pixelX,
      pixelY,
      pixelWidth,
      pixelHeight,
      isHole,
      underlyingBinText);

  /// Create a copy of DetectedBin
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DetectedBinImplCopyWith<_$DetectedBinImpl> get copyWith =>
      __$$DetectedBinImplCopyWithImpl<_$DetectedBinImpl>(this, _$identity);
}

abstract class _DetectedBin extends DetectedBin {
  const factory _DetectedBin(
      {required final int xGrid,
      required final int yGrid,
      required final int widthUnits,
      required final int depthUnits,
      final String? labelText,
      final double ocrConfidence,
      required final double pixelX,
      required final double pixelY,
      required final double pixelWidth,
      required final double pixelHeight,
      final bool isHole,
      final String? underlyingBinText}) = _$DetectedBinImpl;
  const _DetectedBin._() : super._();

  /// Coordonnées et dimensions dans la grille
  @override
  int get xGrid;
  @override
  int get yGrid;
  @override
  int get widthUnits;
  @override
  int get depthUnits;

  /// Texte détecté par OCR
  @override
  String? get labelText;

  /// Niveau de confiance OCR (0.0 à 1.0)
  @override
  double get ocrConfidence;

  /// Coordonnées en pixels (pour le CustomPaint)
  @override
  double get pixelX;
  @override
  double get pixelY;
  @override
  double get pixelWidth;
  @override
  double get pixelHeight;

  /// Flag indiquant si c'est un "trou" (détecté sur couche supérieure)
  @override
  bool get isHole;

  /// Référence à la boîte de la couche inférieure (si isHole = true)
  @override
  String? get underlyingBinText;

  /// Create a copy of DetectedBin
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DetectedBinImplCopyWith<_$DetectedBinImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

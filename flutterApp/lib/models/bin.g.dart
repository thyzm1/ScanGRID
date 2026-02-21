// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bin.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$BinImpl _$$BinImplFromJson(Map<String, dynamic> json) => _$BinImpl(
      binId: json['bin_id'] as String?,
      xGrid: (json['x_grid'] as num).toInt(),
      yGrid: (json['y_grid'] as num).toInt(),
      widthUnits: (json['width_units'] as num).toInt(),
      depthUnits: (json['depth_units'] as num).toInt(),
      labelText: json['label_text'] as String?,
    );

Map<String, dynamic> _$$BinImplToJson(_$BinImpl instance) => <String, dynamic>{
      'bin_id': instance.binId,
      'x_grid': instance.xGrid,
      'y_grid': instance.yGrid,
      'width_units': instance.widthUnits,
      'depth_units': instance.depthUnits,
      'label_text': instance.labelText,
    };

_$BinCreateRequestImpl _$$BinCreateRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$BinCreateRequestImpl(
      xGrid: (json['x_grid'] as num).toInt(),
      yGrid: (json['y_grid'] as num).toInt(),
      widthUnits: (json['width_units'] as num).toInt(),
      depthUnits: (json['depth_units'] as num).toInt(),
      labelText: json['label_text'] as String?,
    );

Map<String, dynamic> _$$BinCreateRequestImplToJson(
        _$BinCreateRequestImpl instance) =>
    <String, dynamic>{
      'x_grid': instance.xGrid,
      'y_grid': instance.yGrid,
      'width_units': instance.widthUnits,
      'depth_units': instance.depthUnits,
      'label_text': instance.labelText,
    };

_$BinUpdateRequestImpl _$$BinUpdateRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$BinUpdateRequestImpl(
      xGrid: (json['x_grid'] as num?)?.toInt(),
      yGrid: (json['y_grid'] as num?)?.toInt(),
      widthUnits: (json['width_units'] as num?)?.toInt(),
      depthUnits: (json['depth_units'] as num?)?.toInt(),
      labelText: json['label_text'] as String?,
    );

Map<String, dynamic> _$$BinUpdateRequestImplToJson(
        _$BinUpdateRequestImpl instance) =>
    <String, dynamic>{
      'x_grid': instance.xGrid,
      'y_grid': instance.yGrid,
      'width_units': instance.widthUnits,
      'depth_units': instance.depthUnits,
      'label_text': instance.labelText,
    };

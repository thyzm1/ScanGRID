// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layer.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$LayerImpl _$$LayerImplFromJson(Map<String, dynamic> json) => _$LayerImpl(
      layerId: json['layer_id'] as String?,
      zIndex: (json['z_index'] as num).toInt(),
      bins: (json['bins'] as List<dynamic>?)
              ?.map((e) => Bin.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$LayerImplToJson(_$LayerImpl instance) =>
    <String, dynamic>{
      'layer_id': instance.layerId,
      'z_index': instance.zIndex,
      'bins': instance.bins.map((e) => e.toJson()).toList(),
    };

_$LayerCreateRequestImpl _$$LayerCreateRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$LayerCreateRequestImpl(
      zIndex: (json['z_index'] as num).toInt(),
      bins: (json['bins'] as List<dynamic>?)
              ?.map((e) => BinCreateRequest.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$LayerCreateRequestImplToJson(
        _$LayerCreateRequestImpl instance) =>
    <String, dynamic>{
      'z_index': instance.zIndex,
      'bins': instance.bins.map((e) => e.toJson()).toList(),
    };

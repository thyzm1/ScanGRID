// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'drawer.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$DrawerImpl _$$DrawerImplFromJson(Map<String, dynamic> json) => _$DrawerImpl(
      drawerId: json['drawer_id'] as String?,
      name: json['name'] as String,
      layers: (json['layers'] as List<dynamic>?)
              ?.map((e) => Layer.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$DrawerImplToJson(_$DrawerImpl instance) =>
    <String, dynamic>{
      'drawer_id': instance.drawerId,
      'name': instance.name,
      'layers': instance.layers.map((e) => e.toJson()).toList(),
    };

_$DrawerCreateRequestImpl _$$DrawerCreateRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$DrawerCreateRequestImpl(
      name: json['name'] as String,
      layers: (json['layers'] as List<dynamic>?)
              ?.map(
                  (e) => LayerCreateRequest.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$DrawerCreateRequestImplToJson(
        _$DrawerCreateRequestImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
      'layers': instance.layers.map((e) => e.toJson()).toList(),
    };

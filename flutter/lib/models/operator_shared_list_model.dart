import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../common.dart';
import 'platform_model.dart';

/// Entrada de la lista compartida de operadores (ID + nombre + nota opcional).
class OperatorSharedEntry {
  final String id;
  final String name;
  final String note;

  OperatorSharedEntry({required this.id, required this.name, this.note = ''});

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'note': note};

  static OperatorSharedEntry fromJson(Map<String, dynamic> json) {
    return OperatorSharedEntry(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      note: json['note'] as String? ?? '',
    );
  }
}

const String _kOptionOperatorSharedList = 'operator_shared_list';

/// Lista compartida entre operadores: ID + nombre. Persistida localmente.
/// (Para compartir entre varios PCs de operadores haría falta sincronización con servidor.)
class OperatorSharedListModel extends GetxController {
  final RxList<OperatorSharedEntry> entries = <OperatorSharedEntry>[].obs;

  OperatorSharedListModel() {
    _load();
  }

  void _load() {
    try {
      final raw = bind.mainGetLocalOption(key: _kOptionOperatorSharedList);
      if (raw.isEmpty) return;
      final list = jsonDecode(raw) as List<dynamic>?;
      if (list == null) return;
      entries.assignAll(
        list
            .map((e) => OperatorSharedEntry.fromJson(e as Map<String, dynamic>))
            .where((e) => e.id.isNotEmpty),
      );
    } catch (_) {}
  }

  Future<void> _save() async {
    final list = entries.map((e) => e.toJson()).toList();
    await bind.mainSetLocalOption(key: _kOptionOperatorSharedList, value: jsonEncode(list));
  }

  void add(String id, String name, {String note = ''}) {
    final idTrim = id.trim();
    if (idTrim.isEmpty) return;
    final existingList = entries.where((e) => e.id == idTrim).toList();
    final noteToKeep = existingList.isEmpty ? note.trim() : existingList.first.note;
    remove(idTrim);
    entries.insert(0, OperatorSharedEntry(id: idTrim, name: name.trim(), note: noteToKeep));
    _save();
  }

  void updateEntry(String id, String name, String note) {
    final idTrim = id.trim();
    final idx = entries.indexWhere((e) => e.id == idTrim);
    if (idx < 0) return;
    entries[idx] = OperatorSharedEntry(id: idTrim, name: name.trim(), note: note.trim());
    _save();
  }

  void remove(String id) {
    entries.removeWhere((e) => e.id == id.trim());
    _save();
  }

  List<OperatorSharedEntry> get list => entries.toList();
}

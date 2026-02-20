import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_hbb/models/platform_model.dart';
import '../../models/user_model.dart';
import '../../common.dart';

/// Sistema de login hardcodeado simple para desarrollo
class SimpleLoginDialog {
  // Usuarios hardcodeados (compartido con login.dart para intentar login local primero)
  static final Map<String, String> hardcodedUsers = {
    'operador1': 'operador123',
    'operador2': 'operador123',
    'admin': 'admin123',
    'usuario': 'usuario123',
  };

  /// Intenta login local con usuarios hardcodeados. Retorna true si coincidió y aplicó el login.
  static Future<bool> tryLocalLogin(String username, String password) async {
    final u = username.trim();
    if (u.isEmpty || password.isEmpty) return false;
    if (!hardcodedUsers.containsKey(u) || hardcodedUsers[u] != password) {
      return false;
    }
    gFFI.userModel.userName.value = u;
    gFFI.userModel.isAdmin.value = (u == 'admin');
    await bind.mainSetLocalOption(
      key: 'user_info',
      value: '{"name":"$u","isAdmin":${u == 'admin'}}',
    );
    return true;
  }

  static Future<bool> show(BuildContext context) async {
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();
    final RxString errorMessage = ''.obs;
    final RxBool isLoading = false.obs;

    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Iniciar Sesión'),
        content: Obx(() => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: usernameController,
                  decoration: const InputDecoration(
                    labelText: 'Usuario',
                    hintText: 'Ingresa tu usuario',
                    prefixIcon: Icon(Icons.person),
                  ),
                  autofocus: true,
                  enabled: !isLoading.value,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    hintText: 'Ingresa tu contraseña',
                    prefixIcon: Icon(Icons.lock),
                  ),
                  obscureText: true,
                  enabled: !isLoading.value,
                  onSubmitted: (_) {
                    if (!isLoading.value) {
                      _handleLogin(
                        context,
                        usernameController.text.trim(),
                        passwordController.text.trim(),
                        errorMessage,
                        isLoading,
                      );
                    }
                  },
                ),
                if (errorMessage.value.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    errorMessage.value,
                    style: const TextStyle(
                      color: Colors.red,
                      fontSize: 12,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                const Text(
                  'Usuarios de prueba:\n'
                  'operador1 / operador123\n'
                  'operador2 / operador123\n'
                  'admin / admin123\n'
                  'usuario / usuario123',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            )),
        actions: [
          TextButton(
            onPressed: isLoading.value
                ? null
                : () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          Obx(() => ElevatedButton(
                onPressed: isLoading.value
                    ? null
                    : () => _handleLogin(
                          context,
                          usernameController.text.trim(),
                          passwordController.text.trim(),
                          errorMessage,
                          isLoading,
                        ),
                child: isLoading.value
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Iniciar Sesión'),
              )),
        ],
      ),
    ) ?? false;
  }

  static Future<void> _handleLogin(
    BuildContext context,
    String username,
    String password,
    RxString errorMessage,
    RxBool isLoading,
  ) async {
    if (username.isEmpty) {
      errorMessage.value = 'El usuario no puede estar vacío';
      return;
    }

    if (password.isEmpty) {
      errorMessage.value = 'La contraseña no puede estar vacía';
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    // Simular delay de red
    await Future.delayed(const Duration(milliseconds: 500));

    // Verificar credenciales hardcodeadas
    if (hardcodedUsers.containsKey(username) &&
        hardcodedUsers[username] == password) {
      // Simular login exitoso
      gFFI.userModel.userName.value = username;
      gFFI.userModel.isAdmin.value = username == 'admin';
      
      // Guardar información del usuario
      await bind.mainSetLocalOption(
        key: 'user_info',
        value: '{"name":"$username","isAdmin":${username == 'admin'}}',
      );

      isLoading.value = false;
      Navigator.of(context).pop(true);
    } else {
      isLoading.value = false;
      errorMessage.value = 'Usuario o contraseña incorrectos';
    }
  }
}

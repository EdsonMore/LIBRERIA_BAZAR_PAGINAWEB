// licoreriaApp/src/main/java/com/example/licoreriaApp/service/UsuarioService.java
package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Usuario;
import java.util.List;
import java.util.Optional;

public interface UsuarioService {
    Usuario registrarUsuario(Usuario usuario);

    Usuario autenticar(String correo, String password);

    Optional<Usuario> obtenerPorId(Long id);

    Usuario obtenerPorIdSinOptional(Long id); // ✅ NUEVO MÉTODO

    Optional<Usuario> obtenerPorCorreo(String correo);

    List<Usuario> obtenerTodos();

    Usuario actualizarUsuario(Usuario usuario);

    void eliminarUsuario(Long id);

    boolean existeCorreo(String correo);

    boolean existeDni(String dni);

    boolean existeUser(String user); // ✅ NUEVO MÉTODO

    Usuario asignarRol(Long usuarioId, Long rolId);

    Usuario removerRol(Long usuarioId, Long rolId);

    List<Usuario> obtenerPorRol(String rolNombre);

    
}
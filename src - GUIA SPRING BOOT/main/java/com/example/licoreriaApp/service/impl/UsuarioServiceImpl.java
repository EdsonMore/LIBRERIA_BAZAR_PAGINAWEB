// licoreriaApp/src/main/java/com/example/licoreriaApp/service/impl/UsuarioServiceImpl.java
package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.Rol;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.repository.UsuarioRepository;
import com.example.licoreriaApp.service.RolService;
import com.example.licoreriaApp.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolService rolService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public Usuario registrarUsuario(Usuario usuario) {
        // Verificar unicidad primero
        if (existeCorreo(usuario.getCorreo())) {
            throw new RuntimeException("El correo ya está registrado");
        }
        if (existeUser(usuario.getUser())) {
            throw new RuntimeException("El nombre de usuario ya existe");
        }

        // Codificar contraseña
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        // ✅ CORREGIDO: Solo asignar rol CLIENTE si NO tiene roles
        if (usuario.getRoles() == null || usuario.getRoles().isEmpty()) {
            Rol rolCliente = rolService.obtenerPorNombre("ROLE_CLIENTE")
                    .orElseThrow(() -> new RuntimeException("Rol CLIENTE no encontrado"));
            usuario.getRoles().add(rolCliente);
        }
        // Si ya tiene roles (como el super admin), mantenerlos

        return usuarioRepository.save(usuario);
    }

    @Override
    public Usuario autenticar(String correo, String password) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCorreo(correo);
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (passwordEncoder.matches(password, usuario.getPassword())) {
                // Verificar si el usuario está activo
                if (!usuario.isActivo()) {
                    throw new RuntimeException("Tu cuenta ha sido inhabilitada. Contacta al administrador.");
                }
                return usuario;
            }
        }
        return null;
    }

    @Override
    public Optional<Usuario> obtenerPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    // ✅ NUEVO MÉTODO para evitar el problema de Optional
    @Override
    public Usuario obtenerPorIdSinOptional(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }

    @Override
    public Optional<Usuario> obtenerPorCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo);
    }

    @Override
    public List<Usuario> obtenerTodos() {
        // ✅ USAR la consulta que carga los roles
        try {
            return usuarioRepository.findAllWithRoles();
        } catch (Exception e) {
            // Fallback si hay algún problema
            System.err.println("Error cargando usuarios con roles: " + e.getMessage());
            return usuarioRepository.findAll();
        }
    }

    @Override
    public Usuario actualizarUsuario(Usuario usuario) {
        return usuarioRepository.save(usuario);
    }

    @Override
    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }

    @Override
    public boolean existeCorreo(String correo) {
        return usuarioRepository.existsByCorreo(correo);
    }

    @Override
    public boolean existeDni(String dni) {
        return usuarioRepository.existsByDni(dni);
    }

    // ✅ NUEVO MÉTODO
    @Override
    public boolean existeUser(String user) {
        return usuarioRepository.existsByUser(user);
    }

    @Override
    public Usuario asignarRol(Long usuarioId, Long rolId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Rol rol = rolService.obtenerPorId(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        // Verificar que no tenga ya el rol
        if (usuario.getRoles().stream().noneMatch(r -> r.getId().equals(rolId))) {
            usuario.getRoles().add(rol);
            return usuarioRepository.save(usuario);
        }

        return usuario;
    }

    @Override
    public Usuario removerRol(Long usuarioId, Long rolId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // No permitir remover el último rol
        if (usuario.getRoles().size() <= 1) {
            throw new RuntimeException("El usuario debe tener al menos un rol");
        }

        usuario.getRoles().removeIf(rol -> rol.getId().equals(rolId));
        return usuarioRepository.save(usuario);
    }

    @Override
    public List<Usuario> obtenerPorRol(String rolNombre) {
        return usuarioRepository.findByRolesNombre(rolNombre);
    }
}
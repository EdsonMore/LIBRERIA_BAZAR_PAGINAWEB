// licoreriaApp/src/main/java/com/example/licoreriaApp/service/impl/RolServiceImpl.java
package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.Permiso;
import com.example.licoreriaApp.model.Rol;
import com.example.licoreriaApp.repository.RolRepository;
import com.example.licoreriaApp.service.PermisoService;
import com.example.licoreriaApp.service.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class RolServiceImpl implements RolService {

    @Autowired
    private PermisoService permisoService;

    @Autowired
    private RolRepository rolRepository;

    @Override
    public List<Rol> obtenerTodos() {
        return rolRepository.findAll();
    }

    @Override
    public Optional<Rol> obtenerPorId(Long id) {
        return rolRepository.findById(id);
    }

    @Override
    public Optional<Rol> obtenerPorNombre(String nombre) {
        return rolRepository.findByNombre(nombre);
    }

    @Override
    public Rol crearRol(Rol rol) {
        if (rol.getId() != null && rolRepository.existsById(rol.getId())) {
            // Si el rol ya tiene ID y existe, es una actualización
            return rolRepository.save(rol);
        }

        // Si no tiene ID o no existe, verificar por nombre
        if (rolRepository.existsByNombre(rol.getNombre())) {
            throw new RuntimeException("El rol ya existe: " + rol.getNombre());
        }
        return rolRepository.save(rol);
    }

    @Override
    public Rol actualizarRol(Long id, Rol rol) {
        Rol rolExistente = rolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        // No permitir cambiar el nombre de roles del sistema
        if (esRolDelSistema(rolExistente.getNombre())) {
            throw new RuntimeException("No se puede modificar un rol del sistema");
        }

        rolExistente.setDescripcion(rol.getDescripcion());
        return rolRepository.save(rolExistente);
    }

    @Override
    public void eliminarRol(Long id) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        // No permitir eliminar roles del sistema
        if (esRolDelSistema(rol.getNombre())) {
            throw new RuntimeException("No se puede eliminar un rol del sistema");
        }

        rolRepository.delete(rol);
    }

    @Override
    public boolean existePorNombre(String nombre) {
        return rolRepository.existsByNombre(nombre);
    }

    @Override
    public void inicializarRoles() {
        List<String> rolesSistema = Arrays.asList(
                "ROLE_SUPER_ADMIN",
                "ROLE_ADMIN",
                "ROLE_ENCARGADO_PRODUCTOS",
                "ROLE_ENCARGADO_VENTAS",
                "ROLE_CLIENTE");

        for (String nombreRol : rolesSistema) {
            if (!existePorNombre(nombreRol)) {
                Rol rol = new Rol();
                rol.setNombre(nombreRol);
                rol.setDescripcion(obtenerDescripcionRol(nombreRol));
                rolRepository.save(rol);
                System.out.println("Rol creado: " + nombreRol);
            }
        }
    }

    @Override
    public Rol asignarPermiso(Long rolId, Long permisoId) {
        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        Permiso permiso = permisoService.obtenerPorId(permisoId)
                .orElseThrow(() -> new RuntimeException("Permiso no encontrado"));

        if (rol.getPermisos().stream().noneMatch(p -> p.getId().equals(permisoId))) {
            rol.getPermisos().add(permiso);
            return rolRepository.save(rol);
        }

        return rol;
    }

    @Override
    public Rol removerPermiso(Long rolId, Long permisoId) {
        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        rol.getPermisos().removeIf(p -> p.getId().equals(permisoId));
        return rolRepository.save(rol);
    }

    @Override
    public List<Permiso> obtenerPermisosDisponibles(Long rolId) {
        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        List<Permiso> todosPermisos = permisoService.obtenerTodos();
        List<Permiso> permisosRol = rol.getPermisos();

        return todosPermisos.stream()
                .filter(p -> permisosRol.stream().noneMatch(pr -> pr.getId().equals(p.getId())))
                .toList();
    }

    @Override
    public boolean rolTienePermiso(Long rolId, String codigoPermiso) {
        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        return rol.tienePermiso(codigoPermiso);
    }

    private String obtenerDescripcionRol(String nombreRol) {
        switch (nombreRol) {
            case "ROLE_SUPER_ADMIN":
                return "Administrador principal con acceso total al sistema";
            case "ROLE_ADMIN":
                return "Administrador de roles y usuarios";
            case "ROLE_ENCARGADO_PRODUCTOS":
                return "Encargado de la gestión de productos";
            case "ROLE_ENCARGADO_VENTAS":
                return "Encargado de la gestión de ventas";
            case "ROLE_CLIENTE":
                return "Cliente del sistema";
            default:
                return "Rol del sistema";
        }
    }

    private boolean esRolDelSistema(String nombreRol) {
        return Arrays.asList("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_ENCARGADO_PRODUCTOS",
                "ROLE_ENCARGADO_VENTAS", "ROLE_CLIENTE").contains(nombreRol);
    }
}
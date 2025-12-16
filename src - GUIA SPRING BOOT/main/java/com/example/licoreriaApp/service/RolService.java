// licoreriaApp/src/main/java/com/example/licoreriaApp/service/RolService.java
package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Permiso;
import com.example.licoreriaApp.model.Rol;
import java.util.List;
import java.util.Optional;

public interface RolService {
    List<Rol> obtenerTodos();

    Optional<Rol> obtenerPorId(Long id);

    Optional<Rol> obtenerPorNombre(String nombre);

    Rol crearRol(Rol rol);

    Rol actualizarRol(Long id, Rol rol);

    void eliminarRol(Long id);

    boolean existePorNombre(String nombre);

    void inicializarRoles();

    Rol asignarPermiso(Long rolId, Long permisoId);

    Rol removerPermiso(Long rolId, Long permisoId);

    List<Permiso> obtenerPermisosDisponibles(Long rolId);

    boolean rolTienePermiso(Long rolId, String codigoPermiso);
}
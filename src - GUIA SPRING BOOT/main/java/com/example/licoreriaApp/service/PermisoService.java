// licoreriaApp/src/main/java/com/example/licoreriaApp/service/PermisoService.java
package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Permiso;
import java.util.List;
import java.util.Optional;

public interface PermisoService {
    List<Permiso> obtenerTodos();

    Optional<Permiso> obtenerPorId(Long id);

    Optional<Permiso> obtenerPorCodigo(String codigo);

    Permiso crearPermiso(Permiso permiso);

    Permiso actualizarPermiso(Long id, Permiso permiso);

    void eliminarPermiso(Long id);

    boolean existePorCodigo(String codigo);

    List<String> obtenerCategorias();

    List<Permiso> obtenerPorCategoria(String categoria);

    void inicializarPermisosBasicos();
}
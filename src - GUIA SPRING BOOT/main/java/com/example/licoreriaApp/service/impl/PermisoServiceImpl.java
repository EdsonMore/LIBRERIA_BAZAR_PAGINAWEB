// licoreriaApp/src/main/java/com/example/licoreriaApp/service/impl/PermisoServiceImpl.java
package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.Permiso;
import com.example.licoreriaApp.repository.PermisoRepository;
import com.example.licoreriaApp.service.PermisoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PermisoServiceImpl implements PermisoService {

    @Autowired
    private PermisoRepository permisoRepository;

    @Override
    public List<Permiso> obtenerTodos() {
        return permisoRepository.findAll();
    }

    @Override
    public Optional<Permiso> obtenerPorId(Long id) {
        return permisoRepository.findById(id);
    }

    @Override
    public Optional<Permiso> obtenerPorCodigo(String codigo) {
        return permisoRepository.findByCodigo(codigo);
    }

    @Override
    public Permiso crearPermiso(Permiso permiso) {
        if (permisoRepository.existsByCodigo(permiso.getCodigo())) {
            throw new RuntimeException("Ya existe un permiso con ese código");
        }
        return permisoRepository.save(permiso);
    }

    @Override
    public Permiso actualizarPermiso(Long id, Permiso permiso) {
        Permiso permisoExistente = permisoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permiso no encontrado"));

        permisoExistente.setNombre(permiso.getNombre());
        permisoExistente.setDescripcion(permiso.getDescripcion());
        permisoExistente.setCategoria(permiso.getCategoria());

        return permisoRepository.save(permisoExistente);
    }

    @Override
    public void eliminarPermiso(Long id) {
        permisoRepository.deleteById(id);
    }

    @Override
    public boolean existePorCodigo(String codigo) {
        return permisoRepository.existsByCodigo(codigo);
    }

    @Override
    public List<String> obtenerCategorias() {
        return permisoRepository.findDistinctCategorias();
    }

    @Override
    public List<Permiso> obtenerPorCategoria(String categoria) {
        return permisoRepository.findByCategoria(categoria);
    }

    @Override
    public void inicializarPermisosBasicos() {
        // Permisos de PRODUCTOS
        crearPermisoSiNoExiste("PRODUCTO_VER", "Ver Productos", "Visualizar listado de productos", "PRODUCTOS");
        crearPermisoSiNoExiste("PRODUCTO_CREAR", "Crear Productos", "Agregar nuevos productos", "PRODUCTOS");
        crearPermisoSiNoExiste("PRODUCTO_EDITAR", "Editar Productos", "Modificar productos existentes", "PRODUCTOS");
        crearPermisoSiNoExiste("PRODUCTO_ELIMINAR", "Eliminar Productos", "Eliminar productos del sistema",
                "PRODUCTOS");

        // Permisos de CATEGORÍAS
        crearPermisoSiNoExiste("CATEGORIA_VER", "Ver Categorías", "Visualizar categorías", "CATEGORIAS");
        crearPermisoSiNoExiste("CATEGORIA_CREAR", "Crear Categorías", "Agregar nuevas categorías", "CATEGORIAS");
        crearPermisoSiNoExiste("CATEGORIA_EDITAR", "Editar Categorías", "Modificar categorías", "CATEGORIAS");
        crearPermisoSiNoExiste("CATEGORIA_ELIMINAR", "Eliminar Categorías", "Eliminar categorías", "CATEGORIAS");

        // Permisos de USUARIOS
        crearPermisoSiNoExiste("USUARIO_VER", "Ver Usuarios", "Visualizar listado de usuarios", "USUARIOS");
        crearPermisoSiNoExiste("USUARIO_CREAR", "Crear Usuarios", "Registrar nuevos usuarios", "USUARIOS");
        crearPermisoSiNoExiste("USUARIO_EDITAR", "Editar Usuarios", "Modificar datos de usuarios", "USUARIOS");
        crearPermisoSiNoExiste("USUARIO_ELIMINAR", "Eliminar Usuarios", "Eliminar usuarios del sistema", "USUARIOS");

        // Permisos de ROLES
        crearPermisoSiNoExiste("ROL_VER", "Ver Roles", "Visualizar roles del sistema", "ROLES");
        crearPermisoSiNoExiste("ROL_CREAR", "Crear Roles", "Crear nuevos roles", "ROLES");
        crearPermisoSiNoExiste("ROL_EDITAR", "Editar Roles", "Modificar roles existentes", "ROLES");
        crearPermisoSiNoExiste("ROL_ELIMINAR", "Eliminar Roles", "Eliminar roles personalizados", "ROLES");
        crearPermisoSiNoExiste("ROL_ASIGNAR", "Asignar Roles", "Asignar roles a usuarios", "ROLES");

        // Permisos de PERMISOS
        crearPermisoSiNoExiste("PERMISO_VER", "Ver Permisos", "Visualizar permisos del sistema", "PERMISOS");
        crearPermisoSiNoExiste("PERMISO_ASIGNAR", "Asignar Permisos", "Asignar permisos a roles", "PERMISOS");

        // Permisos de VENTAS
        crearPermisoSiNoExiste("VENTA_VER", "Ver Ventas", "Visualizar historial de ventas", "VENTAS");
        crearPermisoSiNoExiste("VENTA_CREAR", "Procesar Ventas", "Procesar nuevas ventas", "VENTAS");
        crearPermisoSiNoExiste("VENTA_CANCELAR", "Cancelar Ventas", "Cancelar ventas realizadas", "VENTAS");

        // Permisos de REPORTES
        crearPermisoSiNoExiste("REPORTE_VER", "Ver Reportes", "Visualizar reportes del sistema", "REPORTES");
        crearPermisoSiNoExiste("REPORTE_EXPORTAR", "Exportar Reportes", "Exportar reportes a CSV/PDF", "REPORTES");

        // Permisos de RESEÑAS
        crearPermisoSiNoExiste("RESENA_VER", "Ver Reseñas", "Visualizar reseñas de productos", "RESENAS");
        crearPermisoSiNoExiste("RESENA_MODERAR", "Moderar Reseñas", "Aprobar o rechazar reseñas", "RESENAS");

        System.out.println("✅ Permisos básicos inicializados correctamente");
    }

    private void crearPermisoSiNoExiste(String codigo, String nombre, String descripcion, String categoria) {
        if (!existePorCodigo(codigo)) {
            Permiso permiso = new Permiso(codigo, nombre, descripcion, categoria);
            permisoRepository.save(permiso);
            System.out.println("Permiso creado: " + codigo);
        }
    }
}
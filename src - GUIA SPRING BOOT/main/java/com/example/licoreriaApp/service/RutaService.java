package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.Ruta;
import com.example.licoreriaApp.model.Rol;
import java.util.List;
import java.util.Optional;

public interface RutaService {

    /**
     * Obtiene todas las rutas
     */
    List<Ruta> obtenerTodas();

    /**
     * Obtiene todas las rutas activas
     */
    List<Ruta> obtenerTodasActivas();

    /**
     * Obtiene todas las rutas activas con roles cargados (EAGER)
     */
    List<Ruta> obtenerTodasActivasConRoles();

    /**
     * Obtiene una ruta por ID
     */
    Optional<Ruta> obtenerPorId(Long id);

    /**
     * Obtiene una ruta por path
     */
    Optional<Ruta> obtenerPorRuta(String ruta);

    /**
     * Obtiene una ruta por path y método
     */
    Optional<Ruta> obtenerPorRutaYMetodo(String ruta, String metodo);

    /**
     * Obtiene rutas por categoría
     */
    List<Ruta> obtenerPorCategoria(String categoria);

    /**
     * Obtiene rutas públicas
     */
    List<Ruta> obtenerPublicas();

    /**
     * Obtiene rutas privadas
     */
    List<Ruta> obtenerPrivadas();

    /**
     * Obtiene rutas asignadas a un rol
     */
    List<Ruta> obtenerPorRol(Long rolId);

    /**
     * Obtiene rutas no asignadas a un rol
     */
    List<Ruta> obtenerNoAsignadasARol(Long rolId);

    /**
     * Guarda o actualiza una ruta
     */
    Ruta guardar(Ruta ruta);

    /**
     * Crea una nueva ruta
     */
    Ruta crear(String rutaPath, String metodo, String descripcion, Boolean esPublica, String categoria);

    /**
     * Actualiza una ruta existente
     */
    Ruta actualizar(Long id, Ruta ruta);

    /**
     * Elimina una ruta
     */
    void eliminar(Long id);

    /**
     * Asigna un rol a una ruta
     */
    void asignarRol(Long rutaId, Long rolId);

    /**
     * Remueve un rol de una ruta
     */
    void removerRol(Long rutaId, Long rolId);

    /**
     * Verifica si una ruta existe
     */
    boolean existeRuta(String ruta);

    /**
     * Verifica si una ruta y método existen
     */
    boolean existeRutaYMetodo(String ruta, String metodo);

    /**
     * Obtiene todas las rutas para un patrón de búsqueda
     */
    List<Ruta> buscar(String patron);

    /**
     * Inicializa todas las rutas del sistema
     */
    void inicializarRutas();
}

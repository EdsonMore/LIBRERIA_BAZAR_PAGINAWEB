package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.Ruta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RutaRepository extends JpaRepository<Ruta, Long> {

    /**
     * Busca una ruta por su path y método
     */
    Optional<Ruta> findByRutaAndMetodo(String ruta, String metodo);

    /**
     * Busca una ruta por su path
     */
    Optional<Ruta> findByRuta(String ruta);

    /**
     * Obtiene todas las rutas por categoría
     */
    List<Ruta> findByCategoria(String categoria);

    /**
     * Obtiene todas las rutas públicas
     */
    List<Ruta> findByEsPublicaTrue();

    /**
     * Obtiene todas las rutas privadas
     */
    List<Ruta> findByEsPublicaFalse();

    /**
     * Obtiene todas las rutas activas
     */
    List<Ruta> findByActivaTrue();

    /**
     * Obtiene las rutas por categoría y estado
     */
    List<Ruta> findByCategoriaAndActiva(String categoria, Boolean activa);

    /**
     * Busca rutas que coincidan con un patrón
     */
    List<Ruta> findByRutaContaining(String patron);

    /**
     * Obtiene todas las rutas que pertenecen a un rol específico
     */
    @Query("SELECT r FROM Ruta r JOIN r.rolesPermitidos rol WHERE rol.id = :rolId AND r.activa = true")
    List<Ruta> findByRolId(@Param("rolId") Long rolId);

    /**
     * Obtiene todas las rutas que NO pertenecen a un rol específico
     */
    @Query("SELECT r FROM Ruta r WHERE r.id NOT IN (SELECT ru.id FROM Ruta ru JOIN ru.rolesPermitidos rol WHERE rol.id = :rolId) AND r.activa = true")
    List<Ruta> findByRolIdNot(@Param("rolId") Long rolId);

    /**
     * Verifica si existe una ruta con ese path
     */
    boolean existsByRuta(String ruta);

    /**
     * Verifica si existe una ruta con ese path y método
     */
    boolean existsByRutaAndMetodo(String ruta, String metodo);
}

// src/main/java/com/example/licoreriaApp/repository/ProductoRepository.java
package com.example.licoreriaApp.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.licoreriaApp.model.Producto;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    /**
     * Busca productos por ID de categoría
     */
    List<Producto> findByCategoria_Id(int categoriaId);

    /**
     * Busca productos por ID de categoría y disponibilidad
     */
    List<Producto> findByCategoria_IdAndDisponible(int categoriaId, boolean disponible);

    /**
     * Busca productos por estado de disponibilidad
     */
    List<Producto> findByDisponible(boolean disponible);

    /**
     * Cuenta productos disponibles
     */
    long countByDisponibleTrue();

    /**
     * Busca productos cuyo nombre contenga el texto (ignorando
     * mayúsculas/minúsculas)
     */
    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    /**
     * Busca productos cuyo nombre contenga el texto (ignorando
     * mayúsculas/minúsculas) con paginación
     */
    Page<Producto> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    /**
     * Busca productos por categoría y rango de precio
     */
    @Query("SELECT p FROM Producto p WHERE " +
            "(:categoriaId IS NULL OR p.categoria.id = :categoriaId) AND " +
            "(:minPrecio IS NULL OR p.precio >= :minPrecio) AND " +
            "(:maxPrecio IS NULL OR p.precio <= :maxPrecio) AND " +
            "(:disponible IS NULL OR p.disponible = :disponible)")
    List<Producto> buscarConFiltros(
            @Param("categoriaId") Integer categoriaId,
            @Param("minPrecio") Double minPrecio,
            @Param("maxPrecio") Double maxPrecio,
            @Param("disponible") Boolean disponible);

    /**
     * Encuentra productos con stock bajo (menor al límite especificado)
     */
    @Query("SELECT p FROM Producto p WHERE p.stock < :stockMinimo AND p.stock > 0")
    List<Producto> encontrarConStockBajo(@Param("stockMinimo") int stockMinimo);

    /**
     * Encuentra productos agotados
     */
    List<Producto> findByStockEquals(int stock);

    /**
     * Obtiene productos ordenados por fecha de creación (más recientes primero)
     */
    List<Producto> findTop10ByOrderByIdDesc();
}
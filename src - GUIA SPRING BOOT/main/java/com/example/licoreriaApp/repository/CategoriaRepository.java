// src/main/java/com/example/licoreriaApp/repository/CategoriaRepository.java
package com.example.licoreriaApp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.licoreriaApp.model.Categoria;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    /**
     * Busca categorías por estado de activación
     */
    List<Categoria> findByActiva(boolean activa);

    /**
     * Busca una categoría por su nombre exacto
     */
    Categoria findByNombre(String nombre);

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.categoria.id = :categoriaId")
    int contarProductosPorCategoria(@Param("categoriaId") int categoriaId);
}

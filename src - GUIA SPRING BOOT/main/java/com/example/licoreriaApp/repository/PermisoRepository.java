// licoreriaApp/src/main/java/com/example/licoreriaApp/repository/PermisoRepository.java
package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    Optional<Permiso> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Permiso> findByCategoria(String categoria);

    @Query("SELECT DISTINCT p.categoria FROM Permiso p ORDER BY p.categoria")
    List<String> findDistinctCategorias();
}
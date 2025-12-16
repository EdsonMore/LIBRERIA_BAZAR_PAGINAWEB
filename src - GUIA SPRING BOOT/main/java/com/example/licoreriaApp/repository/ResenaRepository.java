// src/main/java/com/example/licoreriaApp/repository/ResenaRepository.java
package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.Resena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResenaRepository extends JpaRepository<Resena, Long> {

    // ✅ CORREGIDO: usar Long para usuarioId
    @Query("SELECT r FROM Resena r JOIN FETCH r.producto JOIN FETCH r.usuario WHERE r.usuario.id = :usuarioId ORDER BY r.fecha DESC")
    List<Resena> findByUsuarioIdOrderByFechaDesc(@Param("usuarioId") Long usuarioId);

    // ✅ CORREGIDO: usar Integer para productoId (como está en tu modelo)
    @Query("SELECT r FROM Resena r JOIN FETCH r.producto JOIN FETCH r.usuario WHERE r.producto.id = :productoId AND r.estado = :estado ORDER BY r.fecha DESC")
    List<Resena> findByProductoIdAndEstado(@Param("productoId") Integer productoId, @Param("estado") String estado);

    List<Resena> findByEstadoOrderByFechaDesc(String estado);

    // ✅ CORREGIDO: tipos consistentes
    @Query("SELECT COUNT(r) > 0 FROM Resena r WHERE r.usuario.id = :usuarioId AND r.producto.id = :productoId")
    boolean existsByUsuarioAndProducto(@Param("usuarioId") Long usuarioId, @Param("productoId") Integer productoId);
}
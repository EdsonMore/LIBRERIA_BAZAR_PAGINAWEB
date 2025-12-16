// src/main/java/com/example/repository/CompraRepository.java
package com.example.licoreriaApp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.licoreriaApp.model.Compra;
import com.example.licoreriaApp.model.EstadoCompra;

@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    List<Compra> findByUsuarioId(Long usuarioId);

    List<Compra> findByUsuarioIdOrderByFechaCompraDesc(Long usuarioId);

    List<Compra> findByEstado(EstadoCompra estado);

    List<Compra> findByNumeroSeguimiento(String numeroSeguimiento);
    
    @Query("SELECT DISTINCT c FROM Compra c LEFT JOIN FETCH c.detalles WHERE c.usuario.id = :usuarioId AND c.estado = 'ENTREGADA'")
    List<Compra> findComprasEntregadasPorUsuario(@Param("usuarioId") Long usuarioId);
}

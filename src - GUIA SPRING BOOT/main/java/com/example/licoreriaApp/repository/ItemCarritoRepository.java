// src/main/java/com/example/licoreriaApp/repository/ItemCarritoRepository.java
package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.ItemCarrito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemCarritoRepository extends JpaRepository<ItemCarrito, Long> {

    List<ItemCarrito> findByUsuarioId(Long usuarioId);

    // CAMBIO: Usar Query específica para evitar duplicados
    @Query("SELECT i FROM ItemCarrito i WHERE i.usuario.id = :usuarioId AND i.producto.id = :productoId")
    List<ItemCarrito> findAllByUsuarioIdAndProductoId(
            @Param("usuarioId") Long usuarioId,
            @Param("productoId") int productoId
    );

    void deleteByUsuarioId(Long usuarioId);

    // NUEVO: Método para eliminar por usuario y producto
    @Query("DELETE FROM ItemCarrito i WHERE i.usuario.id = :usuarioId AND i.producto.id = :productoId")
    void deleteByUsuarioIdAndProductoId(
            @Param("usuarioId") Long usuarioId,
            @Param("productoId") int productoId
    );
}

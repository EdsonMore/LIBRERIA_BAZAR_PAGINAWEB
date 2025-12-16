package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.Notificacion;
import com.example.licoreriaApp.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioOrderByFechaCreacionDesc(Usuario usuario);
    
    List<Notificacion> findByUsuarioAndLeidaOrderByFechaCreacionDesc(Usuario usuario, Boolean leida);
    
    long countByUsuarioAndLeida(Usuario usuario, Boolean leida);
}

// licoreriaApp/src/main/java/com/example/licoreriaApp/repository/UsuarioRepository.java
package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    boolean existsByDni(String dni);

    boolean existsByUser(String user); // ✅ AGREGAR ESTE MÉTODO

    // ✅ AGREGAR ESTA CONSULTA PARA CARGAR ROLES
    @Query("SELECT DISTINCT u FROM Usuario u LEFT JOIN FETCH u.roles")
    List<Usuario> findAllWithRoles();

    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE r.nombre = :rolNombre")
    List<Usuario> findByRolesNombre(@Param("rolNombre") String rolNombre);
}
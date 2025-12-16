// licoreriaApp/src/main/java/com/example/licoreriaApp/repository/RolRepository.java
package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(String nombre);

    boolean existsByNombre(String nombre);
}
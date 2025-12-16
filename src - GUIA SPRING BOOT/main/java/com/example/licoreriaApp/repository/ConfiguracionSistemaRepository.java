package com.example.licoreriaApp.repository;

import com.example.licoreriaApp.model.ConfiguracionSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionSistemaRepository extends JpaRepository<ConfiguracionSistema, Long> {
    Optional<ConfiguracionSistema> findFirstByOrderByIdAsc();
}

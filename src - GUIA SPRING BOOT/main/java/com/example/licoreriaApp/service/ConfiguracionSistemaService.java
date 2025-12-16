package com.example.licoreriaApp.service;

import com.example.licoreriaApp.model.ConfiguracionSistema;
import com.example.licoreriaApp.repository.ConfiguracionSistemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ConfiguracionSistemaService {

    @Autowired
    private ConfiguracionSistemaRepository configuracionRepository;

    /**
     * Obtiene la configuración del sistema, crea una por defecto si no existe
     */
    @Transactional(readOnly = true)
    public ConfiguracionSistema obtenerConfiguracion() {
        try {
            return configuracionRepository.findFirstByOrderByIdAsc()
                    .orElseGet(this::crearConfiguracionPorDefecto);
        } catch (Exception e) {
            System.err.println("Error al obtener configuración: " + e.getMessage());
            return crearConfiguracionPorDefecto();
        }
    }

    /**
     * Crea una configuración por defecto
     */
    private ConfiguracionSistema crearConfiguracionPorDefecto() {
        ConfiguracionSistema config = new ConfiguracionSistema();
        config.setAplicarIGV(true);
        config.setPorcentajeIGV(18.0);
        config.setAplicarEnvio(true);
        config.setCostoEnvio(15.0);
        return config;
    }

    /**
     * Actualiza la configuración del sistema
     */
    public ConfiguracionSistema actualizarConfiguracion(boolean aplicarIGV, double porcentajeIGV,
                                                         boolean aplicarEnvio, double costoEnvio) {
        ConfiguracionSistema config = obtenerConfiguracion();
        config.setAplicarIGV(aplicarIGV);
        config.setPorcentajeIGV(porcentajeIGV);
        config.setAplicarEnvio(aplicarEnvio);
        config.setCostoEnvio(costoEnvio);
        return configuracionRepository.save(config);
    }

    /**
     * Obtiene el porcentaje de IGV si está activo, sino 0
     */
    @Transactional(readOnly = true)
    public double obtenerTasaIGV() {
        ConfiguracionSistema config = obtenerConfiguracion();
        return config.isAplicarIGV() ? config.getPorcentajeIGV() / 100.0 : 0.0;
    }

    /**
     * Obtiene el costo de envío si está activo, sino 0
     */
    @Transactional(readOnly = true)
    public double obtenerCostoEnvio() {
        ConfiguracionSistema config = obtenerConfiguracion();
        return config.isAplicarEnvio() ? config.getCostoEnvio() : 0.0;
    }

    /**
     * Verifica si IGV está activo
     */
    @Transactional(readOnly = true)
    public boolean estaActivadoIGV() {
        return obtenerConfiguracion().isAplicarIGV();
    }

    /**
     * Verifica si envío está activo
     */
    @Transactional(readOnly = true)
    public boolean estaActivadoEnvio() {
        return obtenerConfiguracion().isAplicarEnvio();
    }
}

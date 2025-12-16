package com.example.licoreriaApp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "configuracion_sistema")
public class ConfiguracionSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aplicar_igv", nullable = false)
    private boolean aplicarIGV = true;

    @Column(name = "porcentaje_igv", nullable = false)
    private double porcentajeIGV = 18.0;

    @Column(name = "aplicar_envio", nullable = false)
    private boolean aplicarEnvio = true;

    @Column(name = "costo_envio", nullable = false)
    private double costoEnvio = 15.0;

    public ConfiguracionSistema() {
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isAplicarIGV() {
        return aplicarIGV;
    }

    public void setAplicarIGV(boolean aplicarIGV) {
        this.aplicarIGV = aplicarIGV;
    }

    public double getPorcentajeIGV() {
        return porcentajeIGV;
    }

    public void setPorcentajeIGV(double porcentajeIGV) {
        this.porcentajeIGV = porcentajeIGV;
    }

    public boolean isAplicarEnvio() {
        return aplicarEnvio;
    }

    public void setAplicarEnvio(boolean aplicarEnvio) {
        this.aplicarEnvio = aplicarEnvio;
    }

    public double getCostoEnvio() {
        return costoEnvio;
    }

    public void setCostoEnvio(double costoEnvio) {
        this.costoEnvio = costoEnvio;
    }
}

package com.example.licoreriaApp.service.impl;

import com.example.licoreriaApp.model.Ruta;
import com.example.licoreriaApp.model.Rol;
import com.example.licoreriaApp.repository.RutaRepository;
import com.example.licoreriaApp.repository.RolRepository;
import com.example.licoreriaApp.service.RutaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RutaServiceImpl implements RutaService {

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private RolRepository rolRepository;

    @Override
    public List<Ruta> obtenerTodas() {
        return rutaRepository.findAll();
    }

    @Override
    @Transactional
    public List<Ruta> obtenerTodasActivasConRoles() {
        List<Ruta> rutas = rutaRepository.findByActivaTrue();

        // Forzar la carga de las relaciones LAZY
        for (Ruta ruta : rutas) {
            if (ruta.getRolesPermitidos() != null) {
                ruta.getRolesPermitidos().size(); // Esto fuerza la carga
            }
        }

        return rutas;
    }

    @Override
    public List<Ruta> obtenerTodasActivas() {
        return rutaRepository.findByActivaTrue();
    }

    @Override
    public Optional<Ruta> obtenerPorId(Long id) {
        return rutaRepository.findById(id);
    }

    @Override
    public Optional<Ruta> obtenerPorRuta(String ruta) {
        return rutaRepository.findByRuta(ruta);
    }

    @Override
    public Optional<Ruta> obtenerPorRutaYMetodo(String ruta, String metodo) {
        return rutaRepository.findByRutaAndMetodo(ruta, metodo);
    }

    @Override
    public List<Ruta> obtenerPorCategoria(String categoria) {
        return rutaRepository.findByCategoria(categoria);
    }

    @Override
    public List<Ruta> obtenerPublicas() {
        return rutaRepository.findByEsPublicaTrue();
    }

    @Override
    public List<Ruta> obtenerPrivadas() {
        return rutaRepository.findByEsPublicaFalse();
    }

    @Override
    public List<Ruta> obtenerPorRol(Long rolId) {
        return rutaRepository.findByRolId(rolId);
    }

    @Override
    public List<Ruta> obtenerNoAsignadasARol(Long rolId) {
        return rutaRepository.findByRolIdNot(rolId);
    }

    @Override
    public Ruta guardar(Ruta ruta) {
        return rutaRepository.save(ruta);
    }

    @Override
    public Ruta crear(String rutaPath, String metodo, String descripcion, Boolean esPublica, String categoria) {
        // Verificar si ya existe
        if (existeRutaYMetodo(rutaPath, metodo)) {
            throw new RuntimeException("La ruta " + rutaPath + " con método " + metodo + " ya existe");
        }

        Ruta nuevaRuta = new Ruta(rutaPath, metodo, descripcion, esPublica, categoria);
        return rutaRepository.save(nuevaRuta);
    }

    @Override
    public Ruta actualizar(Long id, Ruta ruta) {
        Ruta rutaExistente = rutaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

        rutaExistente.setRuta(ruta.getRuta());
        rutaExistente.setMetodo(ruta.getMetodo());
        rutaExistente.setDescripcion(ruta.getDescripcion());
        rutaExistente.setEsPublica(ruta.getEsPublica());
        rutaExistente.setCategoria(ruta.getCategoria());
        rutaExistente.setActiva(ruta.getActiva());

        return rutaRepository.save(rutaExistente);
    }

    @Override
    public void eliminar(Long id) {
        rutaRepository.deleteById(id);
    }

    @Override
    public void asignarRol(Long rutaId, Long rolId) {
        Ruta ruta = rutaRepository.findById(rutaId)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        ruta.agregarRol(rol);
        rutaRepository.save(ruta);
    }

    @Override
    public void removerRol(Long rutaId, Long rolId) {
        Ruta ruta = rutaRepository.findById(rutaId)
                .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        ruta.removerRol(rol);
        rutaRepository.save(ruta);
    }

    @Override
    public boolean existeRuta(String ruta) {
        return rutaRepository.existsByRuta(ruta);
    }

    @Override
    public boolean existeRutaYMetodo(String ruta, String metodo) {
        return rutaRepository.existsByRutaAndMetodo(ruta, metodo);
    }

    @Override
    public List<Ruta> buscar(String patron) {
        return rutaRepository.findByRutaContaining(patron);
    }

    @Override
    public void inicializarRutas() {
        // Las rutas se inicializarán en el DataInitializer
        System.out.println("✅ Servicio de rutas inicializado");
    }
}

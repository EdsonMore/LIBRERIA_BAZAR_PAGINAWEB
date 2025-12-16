package com.example.licoreriaApp.controller;

import com.example.licoreriaApp.model.Rol;
import com.example.licoreriaApp.model.Ruta;
import com.example.licoreriaApp.model.Usuario;
import com.example.licoreriaApp.service.RutaService;
import com.example.licoreriaApp.service.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/superAdmin/rutas")
@Transactional
public class RutaController {

    @Autowired
    private RutaService rutaService;

    @Autowired
    private RolService rolService;

    // ============================================================
    // 🔷 MIDDLEWARE DE PERMISOS
    // ============================================================
    private boolean tienePermiso(HttpSession session) {
        Usuario usuario = (Usuario) session.getAttribute("usuario");
        return usuario != null && usuario.esSuperAdmin();
    }

    // ============================================================
    // 🔷 VISTAS HTML
    // ============================================================

    @GetMapping("")
    public String gestionRutas(HttpSession session, Model model) {
        System.out.println("🎯 INICIANDO gestiónRutas...");

        if (!tienePermiso(session)) {
            System.out.println("❌ Sin permisos, redirigiendo...");
            return "redirect:/acceso-denegado";
        }

        try {
            Usuario usuario = (Usuario) session.getAttribute("usuario");
            model.addAttribute("usuario", usuario);

            System.out.println("🔍 Obteniendo rutas con roles...");

            // Usar el nuevo método que carga las relaciones
            List<Ruta> rutas = rutaService.obtenerTodasActivas();
            System.out.println("✅ Rutas obtenidas: " + rutas.size());

            // Crear DTOs SIMPLIFICADOS - solo datos esenciales
            List<Map<String, Object>> rutasDTO = new ArrayList<>();

            for (Ruta ruta : rutas) {
                Map<String, Object> rutaMap = new HashMap<>();
                rutaMap.put("id", ruta.getId());
                rutaMap.put("ruta", ruta.getRuta());
                rutaMap.put("metodo", ruta.getMetodo());
                rutaMap.put("descripcion", ruta.getDescripcion());
                rutaMap.put("esPublica", ruta.getEsPublica());
                rutaMap.put("categoria", ruta.getCategoria());
                rutaMap.put("activa", ruta.getActiva());

                // Solo obtener nombres de roles, no objetos completos
                List<String> nombresRoles = new ArrayList<>();
                if (ruta.getRolesPermitidos() != null) {
                    for (Rol rol : ruta.getRolesPermitidos()) {
                        nombresRoles.add(rol.getNombre());
                    }
                }
                rutaMap.put("nombresRoles", nombresRoles);
                rutaMap.put("rolesCount", nombresRoles.size());

                rutasDTO.add(rutaMap);
            }

            model.addAttribute("rutas", rutasDTO);

            // Estadísticas
            long totalRutas = rutas.size();
            long rutasPublicas = rutas.stream().filter(Ruta::getEsPublica).count();
            long rutasPrivadas = rutas.stream().filter(r -> !r.getEsPublica()).count();
            long categorias = rutas.stream()
                    .map(Ruta::getCategoria)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();

            model.addAttribute("totalRutas", totalRutas);
            model.addAttribute("rutasPublicas", rutasPublicas);
            model.addAttribute("rutasPrivadas", rutasPrivadas);
            model.addAttribute("categoriasCount", categorias);

            System.out.println("✅ Datos preparados para la vista - " + rutasDTO.size() + " rutas procesadas");

            return "superAdmin/gestion-rutas";

        } catch (Exception e) {
            System.err.println("💥 ERROR CRÍTICO en gestiónRutas: " + e.getMessage());
            e.printStackTrace();

            // En caso de error, mostrar datos vacíos
            model.addAttribute("rutas", new ArrayList<>());
            model.addAttribute("totalRutas", 0);
            model.addAttribute("rutasPublicas", 0);
            model.addAttribute("rutasPrivadas", 0);
            model.addAttribute("categoriasCount", 0);
            model.addAttribute("error", "Error al cargar rutas: " + e.getMessage());

            return "superAdmin/gestion-rutas";
        }
    }

    @GetMapping("/{id}")
    public String detalleRuta(@PathVariable Long id, HttpSession session, Model model) {
        if (!tienePermiso(session)) {
            return "redirect:/acceso-denegado";
        }

        try {
            Ruta ruta = rutaService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

            Usuario usuario = (Usuario) session.getAttribute("usuario");
            model.addAttribute("usuario", usuario);
            model.addAttribute("ruta", ruta);

            // Obtener roles disponibles y asignados
            List<Rol> rolesDisponibles = rolService.obtenerTodos();
            List<Rol> rolesAsignados = ruta.getRolesPermitidos();

            model.addAttribute("rolesDisponibles", rolesDisponibles);
            model.addAttribute("rolesAsignados", rolesAsignados);

            return "superAdmin/detalle-ruta";

        } catch (Exception e) {
            model.addAttribute("error", "Ruta no encontrada");
            return "redirect:/superAdmin/rutas";
        }
    }

    // ============================================================
    // 🔷 ENDPOINTS API REST
    // ============================================================

    @GetMapping("/todos")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerTodasRutas(HttpSession session) {
        if (!tienePermiso(session)) {
            return ResponseEntity.status(403).build();
        }

        try {
            List<Ruta> rutas = rutaService.obtenerTodasActivas();

            List<Map<String, Object>> rutasDTO = rutas.stream().map(ruta -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", ruta.getId());
                dto.put("ruta", ruta.getRuta());
                dto.put("metodo", ruta.getMetodo());
                dto.put("descripcion", ruta.getDescripcion());
                dto.put("esPublica", ruta.getEsPublica());
                dto.put("categoria", ruta.getCategoria());
                dto.put("activa", ruta.getActiva());
                dto.put("rolesCount", ruta.getRolesPermitidos().size());

                List<Map<String, String>> rolesData = ruta.getRolesPermitidos().stream()
                        .map(rol -> {
                            Map<String, String> r = new HashMap<>();
                            r.put("id", rol.getId().toString());
                            r.put("nombre", rol.getNombre());
                            return r;
                        })
                        .collect(Collectors.toList());
                dto.put("roles", rolesData);

                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(rutasDTO);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/crear")
    public String crearRuta(
            @RequestParam String ruta,
            @RequestParam String metodo,
            @RequestParam(required = false) String descripcion,
            @RequestParam Boolean esPublica,
            @RequestParam String categoria,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session)) {
            return "redirect:/acceso-denegado";
        }

        try {
            // Validaciones
            if (ruta == null || ruta.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "La ruta es obligatoria");
                return "redirect:/superAdmin/rutas";
            }

            if (metodo == null || metodo.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "El método es obligatorio");
                return "redirect:/superAdmin/rutas";
            }

            // Verificar si ya existe
            if (rutaService.existeRutaYMetodo(ruta, metodo)) {
                redirectAttributes.addFlashAttribute("error",
                        "La ruta " + ruta + " con método " + metodo + " ya existe");
                return "redirect:/superAdmin/rutas";
            }

            rutaService.crear(
                    ruta.trim(),
                    metodo.trim(),
                    descripcion != null ? descripcion.trim() : "",
                    esPublica,
                    categoria != null ? categoria.trim() : "GENERAL");

            redirectAttributes.addFlashAttribute("success", "Ruta creada exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al crear ruta: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/rutas";
    }

    @PostMapping("/editar")
    public String editarRuta(
            @RequestParam Long id,
            @RequestParam(required = false) String descripcion,
            @RequestParam Boolean activa,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        if (!tienePermiso(session)) {
            return "redirect:/acceso-denegado";
        }

        try {
            Ruta ruta = rutaService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

            ruta.setDescripcion(descripcion != null ? descripcion.trim() : "");
            ruta.setActiva(activa);

            rutaService.guardar(ruta);

            redirectAttributes.addFlashAttribute("success", "Ruta actualizada exitosamente");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al actualizar ruta: " + e.getMessage());
            e.printStackTrace();
        }

        return "redirect:/superAdmin/rutas";
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> eliminarRuta(@PathVariable Long id, HttpSession session) {
        if (!tienePermiso(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", "Sin permisos");
            return ResponseEntity.status(403).body(response);
        }

        try {
            // Verificar que la ruta existe
            rutaService.obtenerPorId(id)
                    .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

            rutaService.eliminar(id);

            Map<String, Object> response = new HashMap<>();
            response.put("exito", true);
            response.put("mensaje", "Ruta eliminada exitosamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", "Error al eliminar: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/{rutaId}/asignar-rol/{rolId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> asignarRolARuta(
            @PathVariable Long rutaId,
            @PathVariable Long rolId,
            HttpSession session) {

        if (!tienePermiso(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", "Sin permisos");
            return ResponseEntity.status(403).body(response);
        }

        try {
            rutaService.asignarRol(rutaId, rolId);

            Map<String, Object> response = new HashMap<>();
            response.put("exito", true);
            response.put("mensaje", "Rol asignado a ruta exitosamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    @PostMapping("/{rutaId}/remover-rol/{rolId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> removerRolDeRuta(
            @PathVariable Long rutaId,
            @PathVariable Long rolId,
            HttpSession session) {

        if (!tienePermiso(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", "Sin permisos");
            return ResponseEntity.status(403).body(response);
        }

        try {
            rutaService.removerRol(rutaId, rolId);

            Map<String, Object> response = new HashMap<>();
            response.put("exito", true);
            response.put("mensaje", "Rol removido de ruta exitosamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    @GetMapping("/{rutaId}/roles-disponibles")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerRolesDisponibles(
            @PathVariable Long rutaId,
            HttpSession session) {

        if (!tienePermiso(session)) {
            return ResponseEntity.status(403).build();
        }

        try {
            Ruta ruta = rutaService.obtenerPorId(rutaId)
                    .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

            List<Rol> todosLosRoles = rolService.obtenerTodos();
            List<Long> rolesAsignados = ruta.getRolesPermitidos().stream()
                    .map(Rol::getId)
                    .collect(Collectors.toList());

            List<Map<String, Object>> rolesDTO = todosLosRoles.stream().map(rol -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", rol.getId());
                dto.put("nombre", rol.getNombre());
                dto.put("descripcion", rol.getDescripcion());
                dto.put("asignado", rolesAsignados.contains(rol.getId()));
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(rolesDTO);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{rutaId}/toggle-estado")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleEstadoRuta(
            @PathVariable Long rutaId,
            @RequestBody Map<String, Boolean> payload,
            HttpSession session) {

        if (!tienePermiso(session)) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", "Sin permisos");
            return ResponseEntity.status(403).body(response);
        }

        try {
            Ruta ruta = rutaService.obtenerPorId(rutaId)
                    .orElseThrow(() -> new RuntimeException("Ruta no encontrada"));

            Boolean nuevoEstado = payload.get("activa");
            if (nuevoEstado == null) {
                nuevoEstado = !ruta.getActiva();
            }

            ruta.setActiva(nuevoEstado);
            rutaService.guardar(ruta);

            Map<String, Object> response = new HashMap<>();
            response.put("exito", true);
            response.put("mensaje", "Estado de ruta actualizado");
            response.put("nuevaActiva", nuevoEstado);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("exito", false);
            response.put("mensaje", "Error al actualizar: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/categoria/{categoria}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerRutasPorCategoria(
            @PathVariable String categoria,
            HttpSession session) {

        if (!tienePermiso(session)) {
            return ResponseEntity.status(403).build();
        }

        try {
            List<Ruta> rutas = rutaService.obtenerPorCategoria(categoria);

            List<Map<String, Object>> rutasDTO = rutas.stream().map(ruta -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", ruta.getId());
                dto.put("ruta", ruta.getRuta());
                dto.put("metodo", ruta.getMetodo());
                dto.put("descripcion", ruta.getDescripcion());
                dto.put("esPublica", ruta.getEsPublica());
                dto.put("rolesCount", ruta.getRolesPermitidos().size());
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(rutasDTO);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/rol/{rolId}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerRutasPorRol(
            @PathVariable Long rolId,
            HttpSession session) {

        if (!tienePermiso(session)) {
            return ResponseEntity.status(403).build();
        }

        try {
            List<Ruta> rutas = rutaService.obtenerPorRol(rolId);

            List<Map<String, Object>> rutasDTO = rutas.stream().map(ruta -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", ruta.getId());
                dto.put("ruta", ruta.getRuta());
                dto.put("metodo", ruta.getMetodo());
                dto.put("categoria", ruta.getCategoria());
                dto.put("esPublica", ruta.getEsPublica());
                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(rutasDTO);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}

package com.example.licoreriaApp.config;

import com.example.licoreriaApp.repository.RutaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;

@Component
public class DynamicRouteSecurityFilter extends OncePerRequestFilter {

    @Autowired(required = false)
    private RutaRepository rutaRepository;

    private static final String[] PUBLIC_PATHS = {
        "/static/**",
        "/css/**",
        "/js/**",
        "/img/**",
        "/webjars/**",
        "/favicon.ico",
        "/error/**"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        // Permitir rutas públicas
        if (isPublicPath(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Si no hay BD aún, permitir (durante inicialización)
        if (rutaRepository == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Validar ruta en BD
            var rutaOptional = rutaRepository.findByRutaAndMetodo(requestPath, method);
            
            if (rutaOptional.isEmpty()) {
                // Buscar por patrón (ej: /productos vs /producto/{id})
                var rutasPatron = rutaRepository.findByRutaContaining(extractBase(requestPath));
                
                if (rutasPatron.isEmpty() && !requestPath.startsWith("/login") && !requestPath.startsWith("/registro")) {
                    // Si es una ruta desconocida, dejar que Spring Security la maneje
                    filterChain.doFilter(request, response);
                    return;
                }
            }

        } catch (Exception e) {
            logger.warn("Error validando ruta dinámicamente: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        return Arrays.stream(PUBLIC_PATHS)
                .anyMatch(publicPath -> path.matches(convertPathToRegex(publicPath)));
    }

    private String convertPathToRegex(String path) {
        return path.replace(".", "\\.")
                .replace("**", ".*")
                .replace("*", "[^/]*");
    }

    private String extractBase(String path) {
        // Extraer la parte base de la ruta (ej: /productos de /producto/123)
        String[] parts = path.split("/");
        if (parts.length > 1) {
            return "/" + parts[1];
        }
        return path;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        return false;
    }
}

package com.example.licoreriaApp.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import com.example.licoreriaApp.service.PermisoService;
import com.example.licoreriaApp.service.RolService;

import jakarta.annotation.PostConstruct;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Autowired
        private PermisoService permisoService;

        @Autowired
        private RolService rolService;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .authorizeHttpRequests(authz -> authz
                                                // Recursos estáticos - acceso público
                                                .requestMatchers(
                                                                "/css/**",
                                                                "/js/**",
                                                                "/img/**",
                                                                "/webjars/**",
                                                                "/favicon.ico")
                                                .permitAll()

                                                // Endpoints de API públicos
                                                .requestMatchers(
                                                                "/api/resenas/producto/**",
                                                                "/api/resenas/debug",
                                                                "/api/carrito/**",
                                                                "/api/categorias/activas",
                                                                "/api/compras/realizar-guest")
                                                .permitAll()

                                                // APIs que requieren autenticación
                                                .requestMatchers(
                                                                "/api/resenas",
                                                                "/api/resenas/**")
                                                .authenticated()

                                                // Páginas públicas
                                                .requestMatchers(
                                                                "/",
                                                                "/home",
                                                                "/index",
                                                                "/productos",
                                                                "/producto/**",
                                                                "/sobre-nosotros",
                                                                "/libro-reclamaciones",
                                                                "/contacto",
                                                                "/registro",
                                                                "/carrito/**",
                                                                "/login",
                                                                "/error/**")
                                                .permitAll()

                                                // Carrito - acceso para clientes y roles superiores
                                                .requestMatchers(
                                                                "/perfil",
                                                                "/mis-compras/**",
                                                                "/mis-resenas/**",
                                                                "/cambiar-password")
                                                .hasAnyAuthority("ROLE_CLIENTE", "ROLE_ENCARGADO_VENTAS",
                                                                "ROLE_ENCARGADO_PRODUCTOS", "ROLE_ADMIN",
                                                                "ROLE_SUPER_ADMIN")

                                                // RUTAS DE SUPER ADMIN
                                                .requestMatchers("/superAdmin/**", "/superAdmin")
                                                .hasAuthority("ROLE_SUPER_ADMIN")

                                                // RUTAS DE ADMIN
                                                .requestMatchers("/admin/**", "/admin")
                                                .hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")

                                                // Gestión de productos
                                                .requestMatchers("/admin/productos/**", "/admin/categorias/**")
                                                .hasAnyAuthority("PRODUCTO_VER", "ROLE_ENCARGADO_PRODUCTOS",
                                                                "ROLE_ADMIN", "ROLE_SUPER_ADMIN")

                                                // Gestión de ventas
                                                .requestMatchers("/admin/ventas/**", "/admin/pedidos/**", "/admin/reportes/**")
                                                .hasAnyAuthority("ROLE_ENCARGADO_VENTAS", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")

                                                // Gestión de usuarios
                                                .requestMatchers("/admin/usuarios/**")
                                                .hasAnyAuthority("USUARIO_VER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN")

                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .loginProcessingUrl("/login")
                                                .defaultSuccessUrl("/login-success", true)
                                                .failureUrl("/login?error=true")
                                                .usernameParameter("correo")
                                                .passwordParameter("password")
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/")
                                                .invalidateHttpSession(true)
                                                .clearAuthentication(true)
                                                .deleteCookies("JSESSIONID", "REMEMBER_ME")
                                                .permitAll())
                                .exceptionHandling(exceptions -> exceptions
                                                .accessDeniedPage("/acceso-denegado"));

                return http.build();
        }

        @Bean
        public org.springframework.security.web.session.HttpSessionEventPublisher httpSessionEventPublisher() {
                return new org.springframework.security.web.session.HttpSessionEventPublisher();
        }

        @PostConstruct
        public void inicializarPermisos() {
                permisoService.inicializarPermisosBasicos();
                rolService.inicializarRoles();
        }

}


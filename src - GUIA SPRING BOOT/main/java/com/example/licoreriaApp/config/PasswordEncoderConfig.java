// licoreriaApp/src/main/java/com/example/licoreriaApp/config/PasswordEncoderConfig.java
package com.example.licoreriaApp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuración separada para el PasswordEncoder
 * Esto evita dependencias circulares con SecurityConfig
 * 
 * @Configuration
 *                public class PasswordEncoderConfig {
 * 
 * @Bean
 *       public PasswordEncoder passwordEncoder() {
 *       return new BCryptPasswordEncoder();
 *       }
 *       }
 */
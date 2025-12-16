// licoreriaApp/src/main/java/com/example/licoreriaApp/controller/CustomErrorController.java
package com.example.licoreriaApp.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);

        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());

            if (statusCode == HttpStatus.NOT_FOUND.value()) {
                model.addAttribute("titulo", "Página no encontrada");
                model.addAttribute("mensaje", "La página que buscas no existe o ha sido movida.");
                return "error/404";
            } else if (statusCode == HttpStatus.FORBIDDEN.value()) {
                model.addAttribute("titulo", "Acceso Denegado");
                model.addAttribute("mensaje", "No tienes permisos para acceder a esta página.");
                return "error/403";
            } else if (statusCode == HttpStatus.INTERNAL_SERVER_ERROR.value()) {
                model.addAttribute("titulo", "Error del Servidor");
                model.addAttribute("mensaje", "Ha ocurrido un error interno en el servidor.");
                return "error/500";
            }
        }

        model.addAttribute("titulo", "Error");
        model.addAttribute("mensaje", "Ha ocurrido un error inesperado.");
        return "error/general";
    }
}

@ControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public String handleAccessDeniedException(AccessDeniedException ex, Model model) {
        model.addAttribute("titulo", "Acceso Denegado");
        model.addAttribute("mensaje", "No tienes permisos para acceder a este recurso.");
        return "error/403";
    }

    @ExceptionHandler(Exception.class)
    public String handleGenericException(Exception ex, Model model) {
        model.addAttribute("titulo", "Error Interno");
        model.addAttribute("mensaje", "Ha ocurrido un error inesperado en el servidor.");
        return "error/500";
    }
}
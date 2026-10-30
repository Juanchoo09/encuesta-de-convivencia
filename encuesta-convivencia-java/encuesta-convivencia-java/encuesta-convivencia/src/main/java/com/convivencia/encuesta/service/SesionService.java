package com.convivencia.encuesta.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SesionService {

    private final Map<String, String> sesionesActivas = new ConcurrentHashMap<>();

    public String crearSesion(String nombreUsuario) {
        String token = UUID.randomUUID().toString();
        sesionesActivas.put(token, nombreUsuario);
        return token;
    }

    public String obtenerUsuarioDeToken(String token) {
        if (token == null) return null;
        return sesionesActivas.get(token);
    }

    public boolean esTokenValido(String token) {
        return token != null && sesionesActivas.containsKey(token);
    }

    public void cerrarSesion(String token) {
        if (token != null) sesionesActivas.remove(token);
    }
}
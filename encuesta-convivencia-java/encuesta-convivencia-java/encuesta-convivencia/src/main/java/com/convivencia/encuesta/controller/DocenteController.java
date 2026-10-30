package com.convivencia.encuesta.controller;

import com.convivencia.encuesta.dto.DocenteResumenDTO;
import com.convivencia.encuesta.dto.LoginDocenteDTO;
import com.convivencia.encuesta.dto.RegistroDocenteDTO;
import com.convivencia.encuesta.model.Docente;
import com.convivencia.encuesta.repository.DocenteRepository;
import com.convivencia.encuesta.service.SesionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controlador REST para que los docentes se registren, inicien sesion,
 * y administren las cuentas existentes (listar y eliminar).
 * Rutas:
 *   POST   /api/docentes/registro
 *   POST   /api/docentes/login
 *   POST   /api/docentes/logout
 *   GET    /api/docentes
 *   DELETE /api/docentes/{id}
 */
@RestController
@RequestMapping("/api/docentes")
@CrossOrigin(origins = "*")
public class DocenteController {

    private final DocenteRepository repositorio;
    private final SesionService sesiones;
    private final BCryptPasswordEncoder codificador = new BCryptPasswordEncoder();

    @Value("${app.docente.codigo-invitacion}")
    private String codigoInvitacionCorrecto;

    public DocenteController(DocenteRepository repositorio, SesionService sesiones) {
        this.repositorio = repositorio;
        this.sesiones = sesiones;
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody RegistroDocenteDTO datos) {
        if (esVacio(datos.getNombreUsuario()) || esVacio(datos.getContrasena()) || esVacio(datos.getNombreCompleto())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario, contraseña y nombre son obligatorios."));
        }
        if (datos.getContrasena().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 6 caracteres."));
        }
        if (esVacio(datos.getCodigoInvitacion()) || !codigoInvitacionCorrecto.equals(datos.getCodigoInvitacion().trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "El código de invitación no es correcto. Pídeselo a la coordinación de tu colegio."));
        }

        String usuario = datos.getNombreUsuario().trim().toLowerCase();

        if (repositorio.existsByNombreUsuario(usuario)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Ese nombre de usuario ya está en uso."));
        }

        Docente nuevo = new Docente(
                usuario,
                codificador.encode(datos.getContrasena()),
                datos.getNombreCompleto().trim(),
                esVacio(datos.getInstitucion()) ? "Sin dato" : datos.getInstitucion().trim(),
                LocalDateTime.now()
        );
        repositorio.save(nuevo);

        String token = sesiones.crearSesion(usuario);
        return ResponseEntity.ok(Map.of(
                "token", token,
                "nombreCompleto", nuevo.getNombreCompleto()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@RequestBody LoginDocenteDTO datos) {
        if (esVacio(datos.getNombreUsuario()) || esVacio(datos.getContrasena())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresa tu usuario y contraseña."));
        }

        String usuario = datos.getNombreUsuario().trim().toLowerCase();

        return repositorio.findByNombreUsuario(usuario)
                .filter(docente -> codificador.matches(datos.getContrasena(), docente.getContrasenaHash()))
                .map(docente -> {
                    String token = sesiones.crearSesion(usuario);
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "nombreCompleto", docente.getNombreCompleto()
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Usuario o contraseña incorrectos.")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> cerrarSesion(@RequestHeader(value = "X-Token", required = false) String token) {
        sesiones.cerrarSesion(token);
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
    }

    /** Lista todos los profesores registrados (cualquier docente logueado puede verla). */
    @GetMapping
    public ResponseEntity<?> listar(@RequestHeader(value = "X-Token", required = false) String token) {
        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }

        DateTimeFormatter formato = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<DocenteResumenDTO> lista = repositorio.findAll().stream()
                .map(d -> new DocenteResumenDTO(
                        d.getId(),
                        d.getNombreUsuario(),
                        d.getNombreCompleto(),
                        d.getInstitucion(),
                        d.getFechaRegistro().format(formato)))
                .collect(Collectors.toList());

        return ResponseEntity.ok(lista);
    }

    /** Elimina la cuenta de un profesor. Cualquier docente logueado puede eliminar a otro. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id, @RequestHeader(value = "X-Token", required = false) String token) {
        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }

        String usuarioActual = sesiones.obtenerUsuarioDeToken(token);

        return repositorio.findById(id)
                .map(objetivo -> {
                    if (objetivo.getNombreUsuario().equals(usuarioActual)) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "No puedes eliminar tu propia cuenta desde aquí."));
                    }
                    if (repositorio.count() <= 1) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "Debe quedar al menos un trabajador social registrado."));
                    }
                    repositorio.deleteById(id);
                    return ResponseEntity.ok(Map.of("mensaje", "Trabajador social eliminado"));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Trabajador social no encontrado")));
    }

    private boolean esVacio(String texto) {
        return texto == null || texto.isBlank();
    }
}
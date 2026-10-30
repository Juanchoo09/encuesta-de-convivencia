package com.convivencia.encuesta.controller;

import com.convivencia.encuesta.dto.AlertaDTO;
import com.convivencia.encuesta.dto.EstadisticasDTO;
import com.convivencia.encuesta.dto.NuevaRespuestaDTO;
import com.convivencia.encuesta.dto.PuntoEvolucionDTO;
import com.convivencia.encuesta.dto.RespuestaResumenDTO;
import com.convivencia.encuesta.model.Respuesta;
import com.convivencia.encuesta.repository.RespuestaRepository;
import com.convivencia.encuesta.service.SesionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class EncuestaController {

    private final RespuestaRepository repositorio;
    private final SesionService sesiones;

    // Umbral a partir del cual un curso/institucion se considera en alerta (igual que "rojo")
    private static final int UMBRAL_ALERTA = 61;

    // Preguntas en lenguaje mas simple, para estudiantes de 10 a 12 años
    private static final List<String> PREGUNTAS_SIMPLE = List.of(
            "¿Has visto que se rían feo o insulten a un compañero?",
            "¿Has visto que alguien golpee o empuje a un compañero?",
            "¿Has visto que no dejen jugar o hablar a un compañero a propósito?",
            "¿Has escuchado apodos feos sobre algún compañero?",
            "¿Has visto que asusten o amenacen a algún compañero?",
            "¿Has visto mensajes feos hacia un compañero en el celular o redes sociales?",
            "¿Has visto que le rompan o le quiten cosas a algún compañero a propósito?",
            "¿Hay lugares del colegio donde algunos compañeros tienen miedo de ir?",
            "¿Sientes que los profesores ayudan poco cuando pasa algo de esto?",
            "¿Crees que a los estudiantes les da miedo contarle a un adulto cuando pasa algo de esto?"
    );

    // Preguntas en lenguaje un poco mas elaborado, para estudiantes de 13 a 15 años
    private static final List<String> PREGUNTAS_ESTANDAR = List.of(
            "¿Has visto que se burlen o insulten a un compañero?",
            "¿Has visto que alguien golpee o empuje a un compañero?",
            "¿Has visto que dejen a alguien fuera del grupo a propósito?",
            "¿Has escuchado apodos feos o rumores sobre algún compañero?",
            "¿Has visto que amenacen o asusten a algún compañero?",
            "¿Has visto mensajes o comentarios feos hacia un compañero en redes sociales o el celular?",
            "¿Has visto que le rompan o le quiten cosas a algún compañero a propósito?",
            "¿Hay lugares del colegio donde algunos compañeros tienen miedo de ir?",
            "¿Sientes que los profesores ayudan poco cuando pasa algo de esto?",
            "¿Crees que a los estudiantes les da miedo contarle a un adulto cuando pasa algo de esto?"
    );

    public EncuestaController(RespuestaRepository repositorio, SesionService sesiones) {
        this.repositorio = repositorio;
        this.sesiones = sesiones;
    }

    /** Devuelve las preguntas adaptadas a la edad (10-12: lenguaje simple; 13+: estandar). */
    @GetMapping("/preguntas")
    public List<String> obtenerPreguntas(@RequestParam(required = false) Integer edad) {
        if (edad != null && edad <= 12) {
            return PREGUNTAS_SIMPLE;
        }
        return PREGUNTAS_ESTANDAR;
    }

    @PostMapping("/respuestas")
    public ResponseEntity<?> guardarRespuesta(@RequestBody NuevaRespuestaDTO datos) {
        if (datos.getRespuestas() == null || datos.getRespuestas().size() != PREGUNTAS_ESTANDAR.size()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Debes responder las " + PREGUNTAS_ESTANDAR.size() + " preguntas."));
        }
        if (esVacio(datos.getNombre()) || esVacio(datos.getApellido()) || esVacio(datos.getInstitucion()) || datos.getEdad() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Debes completar nombre, apellido, edad e institución."));
        }

        int suma = datos.getRespuestas().stream().mapToInt(Integer::intValue).sum();
        int maximo = PREGUNTAS_ESTANDAR.size() * 4;
        int porcentaje = (int) Math.round((suma * 100.0) / maximo);
        String categoria = categoriaDe(porcentaje);

        String valores = datos.getRespuestas().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        String curso = esVacio(datos.getCurso()) ? "Sin dato" : datos.getCurso().trim();

        Respuesta nueva = new Respuesta(
                datos.getNombre().trim(),
                datos.getApellido().trim(),
                datos.getEdad(),
                datos.getInstitucion().trim(),
                curso,
                LocalDateTime.now(),
                valores,
                porcentaje,
                categoria
        );
        repositorio.save(nueva);

        return ResponseEntity.ok(Map.of("porcentaje", porcentaje, "categoria", categoria));
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<?> obtenerEstadisticas(
            @RequestParam(defaultValue = "todos") String curso,
            @RequestParam(defaultValue = "todas") String institucion,
            @RequestHeader(value = "X-Token", required = false) String token) {

        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }

        List<Respuesta> todas = repositorio.findAll();

        List<Respuesta> datos = todas.stream()
                .filter(r -> "todos".equals(curso) || r.getCurso().equals(curso))
                .filter(r -> "todas".equals(institucion) || r.getInstitucion().equals(institucion))
                .collect(Collectors.toList());

        EstadisticasDTO resultado = new EstadisticasDTO();
        resultado.setTotal(datos.size());
        resultado.setCursos(todas.stream().map(Respuesta::getCurso).distinct().sorted().collect(Collectors.toList()));
        resultado.setInstituciones(todas.stream().map(Respuesta::getInstitucion).distinct().sorted().collect(Collectors.toList()));

        // Las alertas siempre se calculan sobre TODOS los datos, sin importar el filtro actual
        resultado.setAlertasCursos(calcularAlertas(todas, Respuesta::getCurso));
        resultado.setAlertasInstituciones(calcularAlertas(todas, Respuesta::getInstitucion));

        if (datos.isEmpty()) {
            resultado.setPromedioGeneral(0);
            resultado.setCategoriaGeneral("verde");
            resultado.setDistribucion(Map.of("verde", 0L, "amarillo", 0L, "rojo", 0L));
            resultado.setPromediosPregunta(java.util.Collections.nCopies(PREGUNTAS_ESTANDAR.size(), 0));
            resultado.setRecientes(List.of());
            return ResponseEntity.ok(resultado);
        }

        int promedio = (int) Math.round(datos.stream().mapToInt(Respuesta::getPorcentaje).average().orElse(0));
        resultado.setPromedioGeneral(promedio);
        resultado.setCategoriaGeneral(categoriaDe(promedio));

        Map<String, Long> distribucion = new LinkedHashMap<>();
        distribucion.put("verde", datos.stream().filter(r -> "verde".equals(r.getCategoria())).count());
        distribucion.put("amarillo", datos.stream().filter(r -> "amarillo".equals(r.getCategoria())).count());
        distribucion.put("rojo", datos.stream().filter(r -> "rojo".equals(r.getCategoria())).count());
        resultado.setDistribucion(distribucion);

        int[] sumasPregunta = new int[PREGUNTAS_ESTANDAR.size()];
        for (Respuesta r : datos) {
            String[] valores = r.getValoresPreguntas().split(",");
            for (int i = 0; i < valores.length && i < sumasPregunta.length; i++) {
                sumasPregunta[i] += Integer.parseInt(valores[i]);
            }
        }
        List<Integer> promediosPregunta = new ArrayList<>();
        for (int sumaPregunta : sumasPregunta) {
            promediosPregunta.add((int) Math.round((sumaPregunta * 100.0) / (datos.size() * 4)));
        }
        resultado.setPromediosPregunta(promediosPregunta);

        DateTimeFormatter formato = DateTimeFormatter.ofPattern("dd/MM HH:mm");
        List<RespuestaResumenDTO> recientes = datos.stream()
                .sorted(Comparator.comparing(Respuesta::getFecha).reversed())
                .limit(15)
                .map(this::aResumen)
                .collect(Collectors.toList());
        resultado.setRecientes(recientes);

        return ResponseEntity.ok(resultado);
    }

    /** Devuelve TODAS las respuestas que cumplan el filtro (sin límite de 15), para exportar. */
    @GetMapping("/respuestas/exportar")
    public ResponseEntity<?> exportarRespuestas(
            @RequestParam(defaultValue = "todos") String curso,
            @RequestParam(defaultValue = "todas") String institucion,
            @RequestHeader(value = "X-Token", required = false) String token) {

        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }

        List<Respuesta> datos = repositorio.findAll().stream()
                .filter(r -> "todos".equals(curso) || r.getCurso().equals(curso))
                .filter(r -> "todas".equals(institucion) || r.getInstitucion().equals(institucion))
                .sorted(Comparator.comparing(Respuesta::getFecha).reversed())
                .collect(Collectors.toList());

        List<RespuestaResumenDTO> resumen = datos.stream().map(this::aResumen).collect(Collectors.toList());
        return ResponseEntity.ok(resumen);
    }

    /** Promedio de porcentaje por dia, para la grafica de evolucion en el tiempo. */
    @GetMapping("/estadisticas/evolucion")
    public ResponseEntity<?> obtenerEvolucion(
            @RequestParam(defaultValue = "todos") String curso,
            @RequestParam(defaultValue = "todas") String institucion,
            @RequestHeader(value = "X-Token", required = false) String token) {

        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }

        List<Respuesta> datos = repositorio.findAll().stream()
                .filter(r -> "todos".equals(curso) || r.getCurso().equals(curso))
                .filter(r -> "todas".equals(institucion) || r.getInstitucion().equals(institucion))
                .collect(Collectors.toList());

        Map<LocalDate, List<Respuesta>> agrupadoPorDia = datos.stream()
                .collect(Collectors.groupingBy(r -> r.getFecha().toLocalDate()));

        DateTimeFormatter formatoFecha = DateTimeFormatter.ofPattern("dd/MM");
        List<PuntoEvolucionDTO> puntos = agrupadoPorDia.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    int promedio = (int) Math.round(e.getValue().stream().mapToInt(Respuesta::getPorcentaje).average().orElse(0));
                    return new PuntoEvolucionDTO(e.getKey().format(formatoFecha), promedio, e.getValue().size());
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(puntos);
    }

    /** Agrega o actualiza el comentario de un profesor sobre una respuesta puntual. */
    @PutMapping("/respuestas/{id}/comentario")
    public ResponseEntity<?> actualizarComentario(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-Token", required = false) String token) {

        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }

        return repositorio.findById(id)
                .map(r -> {
                    r.setComentario(body.get("comentario"));
                    repositorio.save(r);
                    return ResponseEntity.ok(Map.of("mensaje", "Comentario guardado"));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Respuesta no encontrada")));
    }

    @DeleteMapping("/respuestas")
    public ResponseEntity<?> borrarTodo(@RequestHeader(value = "X-Token", required = false) String token) {
        if (!sesiones.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Debes iniciar sesión de nuevo."));
        }
        repositorio.deleteAll();
        return ResponseEntity.ok(Map.of("mensaje", "Todas las respuestas fueron borradas"));
    }

    private RespuestaResumenDTO aResumen(Respuesta r) {
        DateTimeFormatter formato = DateTimeFormatter.ofPattern("dd/MM HH:mm");
        return new RespuestaResumenDTO(
                r.getId(),
                r.getFecha().format(formato),
                r.getNombre() + " " + r.getApellido(),
                r.getEdad(),
                r.getInstitucion(),
                r.getCurso(),
                r.getPorcentaje(),
                r.getCategoria(),
                r.getComentario()
        );
    }

    private List<AlertaDTO> calcularAlertas(List<Respuesta> todas, java.util.function.Function<Respuesta, String> agrupador) {
        Map<String, List<Respuesta>> agrupado = todas.stream().collect(Collectors.groupingBy(agrupador));
        return agrupado.entrySet().stream()
                .map(e -> {
                    int promedio = (int) Math.round(e.getValue().stream().mapToInt(Respuesta::getPorcentaje).average().orElse(0));
                    return new AlertaDTO(e.getKey(), promedio);
                })
                .filter(a -> a.getPromedio() >= UMBRAL_ALERTA)
                .sorted(Comparator.comparingInt(AlertaDTO::getPromedio).reversed())
                .collect(Collectors.toList());
    }

    private boolean esVacio(String texto) {
        return texto == null || texto.isBlank();
    }

    private String categoriaDe(int porcentaje) {
        if (porcentaje <= 30) return "verde";
        if (porcentaje <= 60) return "amarillo";
        return "rojo";
    }
}
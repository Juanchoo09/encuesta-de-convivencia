package com.convivencia.encuesta.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "respuestas")
public class Respuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String apellido;
    private Integer edad;
    private String institucion;
    private String curso;

    private LocalDateTime fecha;
    private String valoresPreguntas;
    private int porcentaje;
    private String categoria;

    public Respuesta() {
    }
    @jakarta.persistence.Column(length = 1000)
    private String comentario;
    public Respuesta(String nombre, String apellido, Integer edad, String institucion, String curso,
                     LocalDateTime fecha, String valoresPreguntas, int porcentaje, String categoria) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.edad = edad;
        this.institucion = institucion;
        this.curso = curso;
        this.fecha = fecha;
        this.valoresPreguntas = valoresPreguntas;
        this.porcentaje = porcentaje;
        this.categoria = categoria;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public Integer getEdad() { return edad; }
    public void setEdad(Integer edad) { this.edad = edad; }

    public String getInstitucion() { return institucion; }
    public void setInstitucion(String institucion) { this.institucion = institucion; }

    public String getCurso() { return curso; }
    public void setCurso(String curso) { this.curso = curso; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public String getValoresPreguntas() { return valoresPreguntas; }
    public void setValoresPreguntas(String valoresPreguntas) { this.valoresPreguntas = valoresPreguntas; }

    public int getPorcentaje() { return porcentaje; }
    public void setPorcentaje(int porcentaje) { this.porcentaje = porcentaje; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }
}
package com.convivencia.encuesta.dto;

import java.util.List;

public class NuevaRespuestaDTO {

    private String nombre;
    private String apellido;
    private Integer edad;
    private String institucion;
    private String curso;
    private List<Integer> respuestas;

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

    public List<Integer> getRespuestas() { return respuestas; }
    public void setRespuestas(List<Integer> respuestas) { this.respuestas = respuestas; }
}
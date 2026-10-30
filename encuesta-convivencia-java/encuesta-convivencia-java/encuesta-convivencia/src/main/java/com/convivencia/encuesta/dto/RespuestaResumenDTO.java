package com.convivencia.encuesta.dto;


public class RespuestaResumenDTO {

    private Long id;
    private String fecha;
    private String nombreCompleto;
    private Integer edad;
    private String institucion;
    private String curso;
    private int porcentaje;
    private String categoria;
    private String comentario;

    public RespuestaResumenDTO(Long id, String fecha, String nombreCompleto, Integer edad, String institucion,
                               String curso, int porcentaje, String categoria, String comentario) {
        this.id = id;
        this.fecha = fecha;
        this.nombreCompleto = nombreCompleto;
        this.edad = edad;
        this.institucion = institucion;
        this.curso = curso;
        this.porcentaje = porcentaje;
        this.categoria = categoria;
        this.comentario = comentario;
    }

    public Long getId() { return id; }
    public String getFecha() { return fecha; }
    public String getNombreCompleto() { return nombreCompleto; }
    public Integer getEdad() { return edad; }
    public String getInstitucion() { return institucion; }
    public String getCurso() { return curso; }
    public int getPorcentaje() { return porcentaje; }
    public String getCategoria() { return categoria; }
    public String getComentario() { return comentario; }
}
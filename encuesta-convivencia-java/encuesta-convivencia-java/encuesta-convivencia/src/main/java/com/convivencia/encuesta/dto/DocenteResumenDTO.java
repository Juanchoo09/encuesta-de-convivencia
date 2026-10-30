package com.convivencia.encuesta.dto;

public class DocenteResumenDTO {

    private Long id;
    private String nombreUsuario;
    private String nombreCompleto;
    private String institucion;
    private String fechaRegistro;

    public DocenteResumenDTO(Long id, String nombreUsuario, String nombreCompleto, String institucion, String fechaRegistro) {
        this.id = id;
        this.nombreUsuario = nombreUsuario;
        this.nombreCompleto = nombreCompleto;
        this.institucion = institucion;
        this.fechaRegistro = fechaRegistro;
    }

    public Long getId() { return id; }
    public String getNombreUsuario() { return nombreUsuario; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getInstitucion() { return institucion; }
    public String getFechaRegistro() { return fechaRegistro; }
}
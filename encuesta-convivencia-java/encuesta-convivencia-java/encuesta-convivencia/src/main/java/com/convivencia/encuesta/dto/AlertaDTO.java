package com.convivencia.encuesta.dto;

public class AlertaDTO {

    private String nombre;
    private int promedio;

    public AlertaDTO(String nombre, int promedio) {
        this.nombre = nombre;
        this.promedio = promedio;
    }

    public String getNombre() { return nombre; }
    public int getPromedio() { return promedio; }
}
package com.convivencia.encuesta.dto;

/** Un punto de la grafica de evolucion: el promedio de un dia especifico. */
public class PuntoEvolucionDTO {

    private String fecha;
    private int promedio;
    private long cantidad;

    public PuntoEvolucionDTO(String fecha, int promedio, long cantidad) {
        this.fecha = fecha;
        this.promedio = promedio;
        this.cantidad = cantidad;
    }

    public String getFecha() { return fecha; }
    public int getPromedio() { return promedio; }
    public long getCantidad() { return cantidad; }
}
package com.convivencia.encuesta.dto;

import java.util.List;
import java.util.Map;

/**
 * Todo lo que necesita el panel del profesor para pintar
 * las tarjetas, el semaforo, la dona, las barras y las alertas.
 */
public class EstadisticasDTO {

    private long total;
    private int promedioGeneral;
    private String categoriaGeneral;
    private Map<String, Long> distribucion;
    private List<Integer> promediosPregunta;
    private List<String> cursos;
    private List<String> instituciones;
    private List<RespuestaResumenDTO> recientes;

    // Alertas: se calculan siempre sobre TODOS los datos (sin importar el filtro actual)
    private List<AlertaDTO> alertasCursos;
    private List<AlertaDTO> alertasInstituciones;

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public int getPromedioGeneral() { return promedioGeneral; }
    public void setPromedioGeneral(int promedioGeneral) { this.promedioGeneral = promedioGeneral; }

    public String getCategoriaGeneral() { return categoriaGeneral; }
    public void setCategoriaGeneral(String categoriaGeneral) { this.categoriaGeneral = categoriaGeneral; }

    public Map<String, Long> getDistribucion() { return distribucion; }
    public void setDistribucion(Map<String, Long> distribucion) { this.distribucion = distribucion; }

    public List<Integer> getPromediosPregunta() { return promediosPregunta; }
    public void setPromediosPregunta(List<Integer> promediosPregunta) { this.promediosPregunta = promediosPregunta; }

    public List<String> getCursos() { return cursos; }
    public void setCursos(List<String> cursos) { this.cursos = cursos; }

    public List<String> getInstituciones() { return instituciones; }
    public void setInstituciones(List<String> instituciones) { this.instituciones = instituciones; }

    public List<RespuestaResumenDTO> getRecientes() { return recientes; }
    public void setRecientes(List<RespuestaResumenDTO> recientes) { this.recientes = recientes; }

    public List<AlertaDTO> getAlertasCursos() { return alertasCursos; }
    public void setAlertasCursos(List<AlertaDTO> alertasCursos) { this.alertasCursos = alertasCursos; }

    public List<AlertaDTO> getAlertasInstituciones() { return alertasInstituciones; }
    public void setAlertasInstituciones(List<AlertaDTO> alertasInstituciones) { this.alertasInstituciones = alertasInstituciones; }
}
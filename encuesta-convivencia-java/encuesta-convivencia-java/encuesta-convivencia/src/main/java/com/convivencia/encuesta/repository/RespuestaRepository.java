package com.convivencia.encuesta.repository;

import com.convivencia.encuesta.model.Respuesta;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring genera automaticamente la implementacion de esta interfaz.
 * Con solo heredar de JpaRepository ya tenemos metodos como
 * save(), findAll(), deleteAll(), etc. sin escribir SQL.
 */
public interface RespuestaRepository extends JpaRepository<Respuesta, Long> {
}

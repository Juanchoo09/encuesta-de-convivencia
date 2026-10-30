package com.convivencia.encuesta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la aplicacion.
 * Al ejecutar esta clase se levanta el servidor web (por defecto en el puerto 8080)
 * y se sirven tanto la API REST como las paginas HTML de la carpeta /static.
 */
@SpringBootApplication
public class EncuestaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EncuestaApplication.class, args);
    }
}

# Convivencia en mi Cole — Encuesta de violencia escolar

Aplicación completa con:
- **Backend en Java** (Spring Boot): guarda las respuestas en una base de datos y calcula las estadísticas.
- **Frontend** (HTML + CSS + JavaScript): la pantalla de encuesta para estudiantes y el panel del profesor, servidos por el mismo backend.

## Requisitos para ejecutarlo

1. **Java 17 o superior** instalado. Verifica con:
   ```
   java -version
   ```
2. **Maven** instalado. Verifica con:
   ```
   mvn -version
   ```
   (Si usas IntelliJ IDEA, Eclipse o VS Code con la extensión de Java, no necesitas instalar Maven aparte: el editor lo trae integrado. Simplemente abre esta carpeta como proyecto Maven.)

No necesitas instalar ninguna base de datos aparte: el proyecto usa H2, una base de datos que se guarda como un archivo dentro de la misma carpeta del proyecto (`./datos/encuesta.mv.db`).

## Cómo ejecutarlo

Desde una terminal, dentro de esta carpeta:

```bash
mvn spring-boot:run
```

Cuando veas en la consola un mensaje como `Started EncuestaApplication`, abre tu navegador en:

```
http://localhost:8080
```

Ahí verás la pantalla de inicio con las dos opciones: **"Soy estudiante"** y **"Soy profesor/a"**.

## Clave del profesor

Por defecto la clave para entrar al panel de resultados es:

```
profe2026
```

**Cámbiala** antes de usar la página con tu colegio, editando el archivo:
`src/main/resources/application.properties` → línea `app.admin.pin=profe2026`

## Cómo usarlo en varios computadores/celulares a la vez (por ejemplo, en un salón de clase)

1. Ejecuta el backend en el computador del profesor (el que hace de "servidor").
2. Averigua la IP de red local de ese computador (en Windows: `ipconfig`, en Mac/Linux: `ifconfig` o `ip a`). Por ejemplo: `192.168.1.15`.
3. En los demás dispositivos, conectados a la misma red WiFi, entra a: `http://192.168.1.15:8080`.
4. Todos los estudiantes pueden responder al mismo tiempo, y el profesor ve el panel actualizarse solo cada 5 segundos.

## Estructura del proyecto

```
encuesta-convivencia/
├── pom.xml                          → dependencias del proyecto (Maven)
├── src/main/java/com/convivencia/encuesta/
│   ├── EncuestaApplication.java     → arranca el servidor
│   ├── controller/EncuestaController.java → la API REST (endpoints)
│   ├── model/Respuesta.java         → cómo se guarda una respuesta en la base de datos
│   ├── repository/RespuestaRepository.java → acceso a la base de datos
│   └── dto/                         → formas de los datos que viajan entre frontend y backend
├── src/main/resources/
│   ├── application.properties       → configuración (puerto, clave admin, base de datos)
│   └── static/                      → el frontend (HTML, CSS, JS)
│       ├── index.html
│       ├── css/estilos.css
│       └── js/app.js
└── datos/                           → aquí se crea automáticamente el archivo de la base de datos
```

## Endpoints de la API (por si quieres explorarlos o probarlos)

| Método | Ruta                  | Qué hace                                      |
|--------|------------------------|------------------------------------------------|
| GET    | `/api/preguntas`       | Devuelve las 10 preguntas de la encuesta        |
| POST   | `/api/respuestas`      | Guarda una respuesta nueva                      |
| POST   | `/api/admin/login`     | Verifica la clave del profesor                  |
| GET    | `/api/estadisticas`    | Devuelve las estadísticas (requiere `?pin=...`) |
| DELETE | `/api/respuestas`      | Borra todas las respuestas (requiere `?pin=...`)|

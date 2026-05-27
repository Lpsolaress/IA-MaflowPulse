# Backend de MAFLOWPULSE — Servicio de Cronometraje Industrial con IA

Este es el backend del sistema MAFLOWPULSE, desarrollado con **FastAPI** y **Python 3.11+**, que utiliza la API de **Gemini** para analizar videos de líneas de montaje en fábricas de automoción y realizar cronometraje industrial directo.

## Stack Tecnológico

- **Python 3.11+**
- **FastAPI** (Framework web moderno y de alto rendimiento)
- **Uvicorn** (Servidor ASGI para producción y desarrollo)
- **google-generativeai** (Librería cliente oficial de Gemini de Google)
- **openpyxl** (Generación de hojas de cálculo de Excel profesional)
- **python-dotenv** (Gestión de variables de entorno)
- **python-multipart** (Procesamiento de carga de archivos multimedia)

## Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- Python 3.11 o superior.
- Administrador de paquetes `pip`.

## Instalación y Configuración

Sigue estos pasos para poner en marcha el backend en tu entorno local:

### 1. Crear y activar un entorno virtual

En la carpeta raíz del backend (`/backend`):

**En macOS y Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**En Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

### 2. Instalar las dependencias

Instala todas las dependencias requeridas usando el archivo [requirements.txt](file:///Users/luispe/IA%20Matrizia/backend/requirements.txt):
```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copia o renombra el archivo `.env.example` a `.env` (o edita el [file://.env](file:///Users/luispe/IA%20Matrizia/backend/.env) existente) y añade tu clave de API de Gemini:

```env
GEMINI_API_KEY=tu_clave_api_de_gemini_aqui
MAX_VIDEO_DURATION_SECONDS=600
TEMP_DIR=app/temp
```

> [!IMPORTANT]  
> Asegúrate de ingresar una clave de API de Gemini válida en `GEMINI_API_KEY` para que el análisis de video por IA funcione correctamente.

---

## Ejecución del Servidor

Para iniciar el servidor de desarrollo utilizando explícitamente el intérprete de tu entorno virtual:

**En macOS y Linux:**
```bash
./venv/bin/python3 -m uvicorn app.main:app --reload
```

**En Windows:**
```cmd
venv\Scripts\python -m uvicorn app.main:app --reload
```

El backend se ejecutará por defecto en `http://localhost:8000`.

### Documentación de la API interactiva

Una vez que el servidor esté corriendo, puedes ver y probar los endpoints interactivos en:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Redoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Endpoints Disponibles

### 1. Analizar Video
- **Ruta:** `POST /api/video/analizar`
- **Tipo de contenido:** `multipart/form-data`
- **Payload:** Archivo de video adjunto bajo el campo `video` (`.mp4` o `.mov` hasta 500MB).
- **Descripción:** Sube el video temporalmente al servidor, lo envía a la File API de Gemini, espera a que el estado sea `ACTIVE`, realiza el análisis de cronometraje mediante la IA `gemini-2.5-flash`, limpia los archivos de Gemini y del servidor local, y finalmente devuelve un JSON con las tareas detectadas.

### 2. Exportar Resultados a Excel
- **Ruta:** `POST /api/video/exportar-excel`
- **Tipo de contenido:** `application/json`
- **Payload:** Listado de elementos de trabajo (`numero`, `elemento`, `inicio`, `fin`, `duracion`).
- **Descripción:** Genera un archivo de Excel `.xlsx` profesional estructurado y formateado con bordes, cabeceras destacadas y fórmulas de suma total.

---

## Estructura del Código del Proyecto

El código está estructurado bajo las directrices del backend de la siguiente manera:
- [main.py](file:///Users/luispe/IA%20Matrizia/backend/app/main.py): Punto de entrada de la aplicación y configuración de CORS.
- [routers/](file:///Users/luispe/IA%20Matrizia/backend/app/routers/): Endpoints REST organizados y schemas Pydantic de entrada/salida.
- [services/](file:///Users/luispe/IA%20Matrizia/backend/app/services/): Lógica de procesamiento de video (Gemini) y generación del reporte de Excel.
- [models/](file:///Users/luispe/IA%20Matrizia/backend/app/models/): Definición de clases y modelos de datos.
- [temp/](file:///Users/luispe/IA%20Matrizia/backend/app/temp/): Directorio de almacenamiento temporal de archivos de video.

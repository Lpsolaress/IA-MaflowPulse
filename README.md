# MAFLOWPULSE

> Cronometraje industrial por inteligencia artificial para líneas de montaje de automoción.

![MAFLOWPULSE](https://img.shields.io/badge/stack-React%20%2B%20FastAPI%20%2B%20Gemini-E53935?style=for-the-badge)
![Status](https://img.shields.io/badge/estado-en%20desarrollo-00C853?style=for-the-badge)

---

## ¿Qué es MaflowPulse?

MaflowPulse es una herramienta diseñada para ingenieros y técnicos de métodos en fábricas de automoción. Permite analizar videos de operarios en líneas de montaje y obtener automáticamente un desglose de cada elemento de trabajo con su tiempo real de ejecución, sin necesidad de cronómetro manual ni sistemas de tiempos predeterminados como MTM.

El usuario sube un video de hasta 10 minutos, la IA lo analiza segundo a segundo, y devuelve una tabla de cronometraje lista para exportar a Excel.

---

## Cómo funciona

```
Usuario sube video (.mp4 / .mov)
        ↓
React → FastAPI recibe el archivo
        ↓
FastAPI → Gemini File API (sube el video)
        ↓
Gemini 2.0 Flash analiza el video por cronometraje directo
        ↓
Devuelve JSON con elementos y tiempos reales
        ↓
React muestra tabla sincronizada con el reproductor de video
        ↓
Exportación a Excel lista para el estudio de tiempos
```

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Inteligencia Artificial | Google Gemini 2.0 Flash |
| Exportación | openpyxl |
| Fuentes | IBM Plex Sans + JetBrains Mono |

---

## Estructura del proyecto

```
maflowpulse/
├── frontend/          # Aplicación React
│   ├── README.md      # Documentación del frontend
│   └── src/
│       ├── pages/
│       │   ├── UploadPage.jsx      # Pantalla de carga de video
│       │   └── ResultsPage.jsx     # Pantalla de resultados
│       ├── components/
│       │   ├── VideoPlayer.jsx     # Reproductor sincronizado
│       │   └── ElementosList.jsx   # Lista de elementos detectados
│       └── services/
│           └── videoService.js     # Llamadas al backend
│
├── backend/           # API Python
│   ├── README.md      # Documentación del backend
│   └── app/
│       ├── main.py
│       ├── routers/
│       │   └── video_router.py     # Endpoints de análisis y exportación
│       ├── services/
│       │   ├── gemini_service.py   # Integración con Gemini
│       │   └── export_service.py   # Generación de Excel
│       └── models/
│           └── video_models.py     # Schemas Pydantic
│
└── README.md          # Este archivo
```

---

## Requisitos previos

- Node.js 18+
- Python 3.11+
- API Key de Google Gemini → [aistudio.google.com](https://aistudio.google.com)

---

## Instalación rápida

### 1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/maflowpulse.git
cd maflowpulse
```

### 2. Configura el backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Añade tu GEMINI_API_KEY en el archivo .env
uvicorn app.main:app --reload
```

### 3. Configura el frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

> Para documentación detallada de cada parte consulta el README dentro de `/frontend` y `/backend`.

---

## Funcionalidades

- **Carga de video** — Drag & drop o selector de archivo, formatos `.mp4` y `.mov`, máximo 10 minutos
- **Análisis por IA** — Gemini 2.0 Flash detecta cada acción manual del operario con su tiempo real
- **Cronometraje directo** — Sin MTM, sin tiempos predeterminados, solo lo que ocurre en el video
- **Clasificación automática** — Cada elemento se clasifica en Tmanual, Tmaquina o Tespera
- **Reproductor sincronizado** — Clic en un elemento y el video salta a ese segundo exacto
- **Exportación a Excel** — Hoja de cronometraje lista para el estudio de tiempos

---

## Precisión del análisis

El cronometraje tiene una precisión de **±0.5 segundos**, suficiente para estudios de tiempos reales en líneas de montaje. Para obtener mejores resultados se recomienda:

- Vídeo en formato MP4 con resolución mínima 720p
- Cámara fija o con movimiento mínimo
- Buena iluminación de la zona de trabajo
- Un solo operario por plano

---

## Variables de entorno

### Backend `.env`

```
GEMINI_API_KEY=tu_clave_aqui
MAX_VIDEO_DURATION_SECONDS=600
TEMP_DIR=app/temp
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:8000
```

---

## Aviso legal

Los videos analizados se suben temporalmente a los servidores de Google a través de la Gemini File API y se eliminan automáticamente tras el análisis. Revisar la política de privacidad de Google AI antes de procesar videos con información sensible de la planta.

---

## Licencia

Uso interno. Todos los derechos reservados © MaflowPulse 2026.

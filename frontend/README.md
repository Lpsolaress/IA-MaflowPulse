# Frontend de MAFLOWPULSE — Interfaz de Cronometraje Industrial

Esta es la aplicación cliente de **MAFLOWPULSE**, construida con **React 18 + Vite** y estilizada mediante **Tailwind CSS** (siguiendo especificaciones y tipografías personalizadas como IBM Plex Sans y JetBrains Mono).

## Características Principales

- **Cargador Inteligente de Video (UploadPage)**: Soporte interactivo para arrastrar y soltar archivos (.mp4, .mov) con validación de tamaño (máximo 500 MB) y estados de carga animados para el procesamiento de IA.
- **Reproductor Sincronizado (VideoPlayer)**: Reproductor nativo que sincroniza bidireccionalmente el tiempo de reproducción actual con la tarjeta seleccionada en el listado de cronometraje.
- **Lista Dinámica (ElementosList)**: Presenta la lista de tareas detectadas, clasifica y asigna automáticamente etiquetas de color en función de la categoría (`Tmanual`, `Tmaquina`, `Tespera`), y muestra resúmenes dinámicos en el pie de página.
- **Exportación de Datos**: Comunicación con la API del backend para descargar reportes estructurados de Excel directamente al navegador del usuario.

---

## Estructura de Carpetas

La estructura sigue las directrices establecidas para el desarrollo del frontend:

```text
src/
  assets/          # Iconos y recursos estáticos
  components/      # Componentes de UI modulares (VideoPlayer, ElementosList)
  hooks/           # Custom hooks reutilizables (useVideoAnalysis)
  pages/           # Vistas completas de la aplicación (UploadPage, ResultsPage, HomePage)
  services/        # Clientes HTTP (Axios) conectados con el backend (videoService)
  utils/           # Funciones de formateo y validación auxiliares
```

---

## Instalación y Configuración

Sigue estos pasos para ejecutar la interfaz de desarrollo en local:

### 1. Instalar dependencias

Asegúrate de estar en el directorio `/frontend` y ejecuta:
```bash
npm install
```

### 2. Configurar variables de entorno

Crea o edita el archivo [.env](file:///Users/luispe/IA%20Matrizia/frontend/.env) en la raíz del frontend. Asegúrate de configurar la URL correspondiente al servidor del backend:

```env
VITE_API_URL=http://localhost:8000
```

---

## Scripts Disponibles

En la carpeta del frontend puedes ejecutar los siguientes comandos:

### Servidor de Desarrollo
Inicia el entorno de ejecución de desarrollo local con recarga en caliente (HMR):
```bash
npm run dev
```
La interfaz estará disponible por defecto en: [http://localhost:5173](http://localhost:5173)

### Compilar para Producción
Genera el compilado final optimizado y minificado en la carpeta `/dist`:
```bash
npm run build
```

### Vista Previa de Producción
Inicia localmente un servidor estático para servir la carpeta `/dist` compilada:
```bash
npm run preview
```

---

## Directrices y Reglas del Proyecto

Para mantener el estándar de calidad en el código, por favor cumple las siguientes reglas:
- **No duplicar configuraciones de Tailwind**: El archivo de estilos y clases ya está configurado globalmente en `tailwind.config.js`.
- **Organización de Lógica**: Nunca agregues lógica pesada de llamadas a APIs dentro del render de los componentes; sepárala en hooks reutilizables o en el archivo `videoService.js`.
- **Idioma**: Todos los textos visibles para el operario o usuario final deben estar redactados en español.

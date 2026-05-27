import os
import logging
import json
from typing import Any, Dict, List, Tuple
import cv2
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
load_dotenv()

# Configurar el registrador de eventos (logger)
logger = logging.getLogger(__name__)

# Configurar la clave de API de Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("No se encontró la variable GEMINI_API_KEY en las variables de entorno (.env).")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Intervalo de captura de frames en segundos (configurable)
FRAME_INTERVAL_SECONDS = 5


class GeminiServiceError(Exception):
    """Excepción base para errores relacionados con el servicio de Gemini."""
    pass


class GeminiUploadError(GeminiServiceError):
    """Excepción que ocurre durante la extracción de frames o procesamiento del video."""
    pass


class GeminiAnalysisError(GeminiServiceError):
    """Excepción que ocurre durante el análisis del video con el modelo de Gemini."""
    pass


def extract_frames(file_path: str, interval_seconds: int = None) -> Tuple[List[Image.Image], float, int]:
    """
    Extrae fotogramas del video a intervalos regulares o dinámicos para optimizar el consumo de tokens
    en la API de Gemini, enviando imágenes en lugar del video completo.

    Args:
        file_path (str): Ruta local del archivo de video.
        interval_seconds (int): Intervalo en segundos entre cada captura de frame. Si es None, se calcula
                                dinámicamente según la duración del video (5-10 segundos).

    Returns:
        Tuple[List[Image.Image], float, int]: Lista de imágenes PIL extraídas, duración total del video en segundos
                                              y el intervalo real de segundos utilizado.

    Raises:
        FileNotFoundError: Si el archivo de video no existe localmente.
        GeminiUploadError: Si no se puede abrir el video o no se extraen frames.
    """
    if not os.path.exists(file_path):
        error_msg = f"El archivo de video no existe en la ruta especificada: {file_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    try:
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            error_msg = f"No se pudo abrir el archivo de video: {file_path}"
            logger.error(error_msg)
            raise GeminiUploadError(error_msg)

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration = total_frames / fps if fps > 0 else 0.0

        # Optimización: calcular el intervalo dinámicamente entre 5 y 10 segundos
        if interval_seconds is None:
            if video_duration < 60:
                interval_seconds = 5
            elif video_duration < 120:
                interval_seconds = 7
            elif video_duration < 180:
                interval_seconds = 8
            else:
                interval_seconds = 10

        frame_interval = max(1, int(fps * interval_seconds))

        logger.info(f"Video: {video_duration:.1f}s, {fps:.0f} FPS, extrayendo 1 frame cada {interval_seconds}s...")

        frames = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % frame_interval == 0:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_frame)
                # Redimensionar para reducir el consumo de tokens en Gemini
                pil_image.thumbnail((512, 512))
                frames.append(pil_image)
            frame_count += 1

        cap.release()

        if not frames:
            error_msg = "No se pudieron extraer frames del video."
            logger.error(error_msg)
            raise GeminiUploadError(error_msg)

        logger.info(f"Se extrajeron {len(frames)} frames del video correctamente.")
        return frames, video_duration, interval_seconds

    except Exception as e:
        if isinstance(e, (GeminiServiceError, FileNotFoundError)):
            raise
        error_msg = f"Error inesperado al extraer frames del video: {str(e)}"
        logger.error(error_msg)
        raise GeminiUploadError(error_msg) from e


def analyze_video(frames: List[Image.Image], video_duration: float, interval_seconds: int = FRAME_INTERVAL_SECONDS) -> Dict[str, Any]:
    """
    Envía los frames extraídos a gemini-2.5-flash para realizar un análisis de cronometraje
    industrial utilizando el prompt configurado.

    Args:
        frames (List[Image.Image]): Lista de imágenes PIL extraídas del video.
        video_duration (float): Duración total del video en segundos.
        interval_seconds (int): Intervalo en segundos entre cada captura de frame.

    Returns:
        Dict[str, Any]: El JSON deserializado con el cronometraje de los elementos identificados.

    Raises:
        GeminiAnalysisError: Si ocurre un error de comunicación, análisis o si la respuesta no es un JSON válido.
    """
    # Validar que la API Key esté configurada
    if not os.getenv("GEMINI_API_KEY"):
        error_msg = "GEMINI_API_KEY no configurada. Por favor, añádela a tu archivo .env."
        logger.error(error_msg)
        raise GeminiAnalysisError(error_msg)

    prompt_exacto = (
    f"Eres un experto senior en cronometraje industrial directo por observación de video.\n"
    f"TU MISIÓN: Identificar los ciclos reales de trabajo del operario y medir cuánto tarda cada acción.\n\n"
    f"REGLAS DE ORO (INCUMPLIMIENTO = ERROR CRÍTICO):\n"
    f"1. PROHIBIDO MTM/TMU: No desgloses acciones en micro-movimientos (alcanzar, coger, mover). "
    f"Cronometra la ACCIÓN COMPLETA (ej: 'Montar pieza' o 'Atornillar base').\n"
    f"2. CRONOMETRAJE DIRECTO: Solo reporta el tiempo real observado. No inventes muestras para rellenar huecos ni para llegar al final del video.\n"
    f"3. SIN RESÚMENES: No incluyas NUNCA un elemento que resuma todo el video o que dure lo mismo que el video completo.\n"
    f"4. FIN REAL: Si la última acción termina en el segundo 3.2 de un video de 4.0, el reporte TERMINA en el 3.2. NO rellenes los 0.8s restantes con 'esperas' o 'muestras vacías'.\n"
    f"5. ACCIONES REPETIDAS: Si una acción se repite varias veces a lo largo del video, NO la agrupes en un solo elemento con tiempo promedio. "
    f"Devuelve UN solo elemento con TODAS sus repeticiones como muestras individuales, "
    f"cada una con su segundo de inicio real y su duración real observada.\n"
    f"6. CATEGORÍAS: Clasifica cada elemento obligatoriamente en una de estas tres categorías:\n"
    f"   - Tmanual: acción manual del operario\n"
    f"   - Tmaquina: tiempo de máquina sin intervención del operario\n"
    f"   - Tespera: espera del operario sin actividad ni máquina\n"
    f"7. DURACIÓN PROMEDIO: Calcula duracion_promedio como la media aritmética real de todas las muestras del elemento.\n\n"
    f"Video de {video_duration:.1f}s capturado cada {interval_seconds}s.\n\n"
    f"Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, "
    f"sin explicaciones, sin texto adicional, sin bloques de código markdown:\n"
    f"{{\n"
    f"  \"elementos\": [\n"
    f"    {{\n"
    f"      \"numero\": 1,\n"
    f"      \"elemento\": \"Descripción de la acción completa\",\n"
    f"      \"categoria\": \"Tmanual\",\n"
    f"      \"muestras\": [\n"
    f"        {{\"numero\": 1, \"duracion\": 2.5, \"inicio_video\": 0.5}},\n"
    f"        {{\"numero\": 2, \"duracion\": 2.4, \"inicio_video\": 15.0}}\n"
    f"      ],\n"
    f"      \"duracion_promedio\": 2.45\n"
    f"    }}\n"
    f"  ]\n"
    f"}}\n"
)

    try:
        logger.info(f"Iniciando el análisis de {len(frames)} frames con gemini-2.5-flash...")

        # Cargar el modelo
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Configurar la respuesta como tipo JSON para garantizar su validez
        generation_config = {
            "response_mime_type": "application/json"
        }

        # Construir el contenido: frames + prompt
        contents = list(frames) + [prompt_exacto]

        # Realizar la llamada de análisis
        response = model.generate_content(
            contents=contents,
            generation_config=generation_config
        )

        if not response or not response.text:
            error_msg = "El modelo Gemini no devolvió ninguna respuesta o el contenido está vacío."
            logger.error(error_msg)
            raise GeminiAnalysisError(error_msg)

        logger.info("Análisis de Gemini completado. Procesando respuesta...")

        # Intentar deserializar la respuesta de tipo JSON
        try:
            resultado_json = json.loads(response.text)
            logger.info("Respuesta decodificada como JSON correctamente.")
            return resultado_json
        except json.JSONDecodeError as jde:
            error_msg = f"La respuesta de Gemini no es un JSON válido: {response.text}"
            logger.error(f"{error_msg}. Error: {str(jde)}")
            raise GeminiAnalysisError(error_msg) from jde

    except Exception as e:
        if isinstance(e, GeminiServiceError):
            raise
        error_msg = f"Error inesperado durante el análisis del video en Gemini: {str(e)}"
        logger.error(error_msg)
        raise GeminiAnalysisError(error_msg) from e

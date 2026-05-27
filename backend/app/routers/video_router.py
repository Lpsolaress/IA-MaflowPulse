import os
import uuid
import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Response
from app.services import gemini_service, export_service
from app.services.gemini_service import GeminiServiceError, GeminiUploadError, GeminiAnalysisError
from app.models.video_models import AnalisisResponse, ElementoTrabajo, Muestra

# Configurar el registrador de eventos (logger)
logger = logging.getLogger(__name__)

# Crear el enrutador de FastAPI
router = APIRouter(
    prefix="/video",
    tags=["Video Analysis"]
)

# Extensiones permitidas de video
ALLOWED_EXTENSIONS = {".mp4", ".mov"}


@router.post(
    "/analizar",
    response_model=AnalisisResponse,
    summary="Subir y analizar un video con Gemini para cronometraje industrial",
    status_code=status.HTTP_200_OK
)
async def analizar_video(video: UploadFile = File(..., description="Archivo de video en formato .mp4 o .mov")) -> AnalisisResponse:
    """
    Endpoint que recibe un archivo de video, lo valida, lo almacena temporalmente y utiliza
    el servicio de Gemini para obtener el cronometraje detallado de los elementos de trabajo.
    """
    # 1. Validar el nombre del archivo y la extensión
    if not video.filename:
        logger.warning("Solicitud de análisis sin nombre de archivo.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de archivo no válido."
        )

    ext = os.path.splitext(video.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.warning(f"Intento de subir formato no permitido: {video.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de archivo no soportado. Solo se permiten: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Obtener y crear el directorio temporal para videos
    temp_dir = os.getenv("TEMP_DIR", "app/temp")
    os.makedirs(temp_dir, exist_ok=True)

    # 2. Generar una ruta temporal única
    unique_filename = f"{uuid.uuid4()}{ext}"
    temp_file_path = os.path.join(temp_dir, unique_filename)

    try:
        # 3. Guardar el archivo de video en el disco local temporalmente
        logger.info(f"Guardando archivo temporal localmente en: {temp_file_path}")
        with open(temp_file_path, "wb") as buffer:
            while content := await video.read(1024 * 1024):  # Bloques de 1 MB
                buffer.write(content)
        logger.info("Archivo guardado localmente de forma exitosa.")

        # 4. Extraer fotogramas del video con intervalo dinámico (5-10 segundos)
        frames, video_duration, interval_used = gemini_service.extract_frames(temp_file_path)

        # 5. Analizar el video con el modelo gemini-2.5-flash
        resultado_raw = gemini_service.analyze_video(frames, video_duration, interval_used)

        # 6. Mapear y validar el resultado con los modelos de Pydantic
        elementos_raw = resultado_raw.get("elementos", [])
        
        elementos: List[ElementoTrabajo] = []
        for i, e in enumerate(elementos_raw):
            try:
                muestras_raw = e.get("muestras", [])
                muestras: List[Muestra] = []
                for j, m in enumerate(muestras_raw):
                    duracion_m = float(m.get("duracion", 0.0))
                    inicio_m = float(m.get("inicio_video", 0.0))
                    
                    # Filtro de seguridad: Si la muestra cubre casi todo el video (ej: > 90%),
                    # es probable que sea un resumen de Gemini y no una acción discreta.
                    if duracion_m >= (video_duration * 0.90):
                        logger.warning(f"Omitiendo muestra que parece ser un resumen (duración {duracion_m}s para video de {video_duration}s)")
                        continue
                        
                    muestras.append(Muestra(
                        numero=int(m.get("numero", len(muestras) + 1)),
                        duracion=duracion_m,
                        inicio_video=inicio_m
                    ))
                
                if not muestras:
                    continue
                
                elem = ElementoTrabajo(
                    numero=int(e.get("numero", i + 1)),
                    elemento=str(e.get("elemento", "Elemento sin descripción")),
                    categoria=str(e.get("categoria", "Tmanual")),
                    muestras=muestras,
                    duracion_promedio=float(e.get("duracion_promedio", 0.0))
                )
                elementos.append(elem)
            except (ValueError, TypeError) as val_err:
                logger.error(f"Error al parsear el elemento {e}: {str(val_err)}")
                # Si algún elemento de la respuesta tiene formato erróneo, continuar con los demás
                continue

        # Calcular totales para el esquema final
        total_elementos = len(elementos)
        
        # Calcular el tiempo final máximo observado en todas las muestras del video
        fin_maximo = 0.0
        for elem in elementos:
            for m in elem.muestras:
                fin_muestra = m.inicio_video + m.duracion
                if fin_muestra > fin_maximo:
                    fin_maximo = fin_muestra

        response_data = AnalisisResponse(
            elementos=elementos,
            total_elementos=total_elementos,
            duracion_total_video=round(fin_maximo if fin_maximo > 0.0 else video_duration, 1)
        )

        logger.info(f"Análisis completado con éxito. Total elementos: {total_elementos}, Duración total: {response_data.duracion_total_video}s")
        return response_data

    # Manejo específico de excepciones
    except GeminiUploadError as gue:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Fallo al extraer y preparar los frames del video: {gue}"
        )
    except GeminiAnalysisError as gae:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Fallo durante el análisis de frames con Gemini: {gae}"
        )
    except GeminiServiceError as gse:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error crítico en el servicio de Gemini: {gse}"
        )
    except Exception as e:
        logger.error(f"Error inesperado en el endpoint de análisis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error inesperado al procesar el video: {str(e)}"
        )

    finally:
        # 7. Limpieza de recursos
        # A. Eliminar el archivo temporal local del servidor
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Archivo temporal local eliminado correctamente: {temp_file_path}")
            except Exception as e:
                logger.error(f"Error en la limpieza al eliminar el archivo temporal local: {str(e)}")


@router.post(
    "/exportar-excel",
    summary="Exportar los elementos de cronometraje a un archivo Excel profesional",
    status_code=status.HTTP_200_OK
)
def exportar_excel(elementos: List[ElementoTrabajo]) -> Response:
    """
    Recibe los elementos de cronometraje en formato JSON y devuelve un archivo Excel
    formateado para su descarga directa.
    """
    try:
        excel_bytes = export_service.generar_excel(elementos)
        
        # Generar nombre del archivo con marca de tiempo actual
        fecha_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"cronometraje_{fecha_str}.xlsx"
        
        # Preparar respuesta de archivo en FastAPI
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"  # Permitir que el frontend acceda al nombre del archivo
        }
        
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error al exportar los datos a Excel: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo generar el archivo Excel: {str(e)}"
        )


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.routers.video_router import router as video_router

# Configurar logging en español
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="API de Cronometraje Industrial",
    description="Backend para el análisis de video y cronometraje utilizando IA",
    version="1.0.0"
)

# Configurar CORS únicamente para http://localhost:5173 en desarrollo
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores con prefijo /api
app.include_router(video_router, prefix="/api")

@app.get("/health", summary="Verificar el estado del servicio")
def health_check() -> dict[str, str]:
    """
    Endpoint para comprobar que el servicio del backend está operativo.
    """
    logger.info("Verificación de estado de salud recibida.")
    return {"status": "ok"}


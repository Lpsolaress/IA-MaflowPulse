from pydantic import BaseModel
from typing import List

class Muestra(BaseModel): 
    numero: int 
    duracion: float 
    inicio_video: float 

class ElementoTrabajo(BaseModel): 
    numero: int 
    elemento: str 
    categoria: str 
    muestras: List[Muestra] 
    duracion_promedio: float 

class AnalisisResponse(BaseModel): 
    elementos: List[ElementoTrabajo] 
    total_elementos: int 
    duracion_total_video: float 

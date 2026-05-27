import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Servicio para gestionar llamadas a la API relacionadas con video.
 */
export const analizarVideo = async (file) => {
  const formData = new FormData();
  formData.append('video', file);

  try {
    const response = await axios.post(`${API_URL}/api/video/analizar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Error desconocido al analizar el video';
    throw new Error(errorMsg);
  }
};

/**
 * Realiza una petición para exportar los elementos de cronometraje a un archivo Excel.
 */
export const exportarExcel = async (elementos) => {
  try {
    const response = await axios.post(`${API_URL}/api/video/exportar-excel`, elementos, {
      responseType: 'blob', // Indicar que la respuesta es binaria
    });
    return response;
  } catch (error) {
    const errorMsg = error.response?.data?.detail || error.message || 'Error desconocido al exportar a Excel';
    throw new Error(errorMsg);
  }
};


import { useState } from 'react';
import { analizarVideo } from '../services/videoService';

/**
 * Hook personalizado para manejar la lógica de estado y negocio del análisis de video.
 */
export const useVideoAnalysis = (onAnalisisCompleto) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const maxSizeBytes = 500 * 1024 * 1024; // 500 MB
    const allowedExtensions = ['.mp4', '.mov'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError('Formato de archivo no soportado. Solo se permiten videos .mp4 y .mov.');
      setFile(null);
      return;
    }

    if (selectedFile.size > maxSizeBytes) {
      setError('El archivo supera el tamaño máximo permitido de 500 MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const iniciarAnalisis = async () => {
    if (!file) {
      setError('Por favor, selecciona un video primero.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await analizarVideo(file);
      if (onAnalisisCompleto) {
        onAnalisisCompleto(resultado, file);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado al realizar el análisis del video.');
    } finally {
      setLoading(false);
    }
  };

  const limpiarSeleccion = () => {
    setFile(null);
    setError(null);
  };

  return {
    file,
    loading,
    error,
    setError,
    handleSelectFile,
    iniciarAnalisis,
    limpiarSeleccion,
  };
};

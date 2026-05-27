import { useState, useRef } from 'react';
import { useVideoAnalysis } from '../hooks/useVideoAnalysis';
import './VideoUploader.css';

/**
 * Componente interactivo para cargar y analizar archivos de video.
 *
 * Props:
 *   onAnalisisCompleto (function): Callback que se ejecuta cuando el backend
 *                                  retorna exitosamente el cronometraje.
 */
const VideoUploader = ({ onAnalisisCompleto }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Utilizar el hook de análisis de video para separar lógica y renderizado
  const {
    file,
    loading,
    error,
    handleSelectFile,
    iniciarAnalisis,
    limpiarSeleccion,
  } = useVideoAnalysis(onAnalisisCompleto);

  // Manejadores de eventos de drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  // Manejadores para abrir el diálogo de selección de archivos
  const handleAreaClick = () => {
    if (fileInputRef.current && !loading) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectFile(e.target.files[0]);
    }
  };

  // Convertir bytes a Megabytes (MB) redondeando a dos decimales
  const bytesToMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="video-uploader-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span className="loading-text">Analizando video con IA...</span>
          <p className="loading-subtext">
            Esto puede tardar unos minutos mientras subimos el video y Gemini procesa el cronometraje.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-uploader-container">
      {/* Zona de Drag & Drop */}
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
      >
        <input
          type="file"
          className="file-input"
          accept=".mp4,.mov"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Icono de subida (SVG estilizado) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="dropzone-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>

        <span className="dropzone-text">
          Arrastra y suelta tu video aquí o haz clic para seleccionar
        </span>
        <span className="dropzone-subtext">
          Formatos soportados: .mp4 y .mov (Máximo 500 MB)
        </span>
      </div>

      {/* Información del archivo seleccionado */}
      {file && (
        <div className="file-info-card">
          <div className="file-info-details">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="file-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.562c0 .621.504 1.125 1.125 1.125h4.75c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125H3.375z"
              />
            </svg>
            <div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{bytesToMB(file.size)} MB</p>
            </div>
          </div>

          <button
            type="button"
            className="btn-remove"
            onClick={(e) => {
              e.stopPropagation();
              limpiarSeleccion();
            }}
            title="Quitar archivo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              style={{ width: '18px', height: '18px' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Acciones */}
      {file && (
        <div className="uploader-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={iniciarAnalisis}
            disabled={loading}
          >
            Analizar video
          </button>
        </div>
      )}

      {/* Banner de error */}
      {error && (
        <div className="error-banner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="error-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="error-message">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;

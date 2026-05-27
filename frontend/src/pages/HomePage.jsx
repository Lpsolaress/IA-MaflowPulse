import { useState } from 'react';
import UploadPage from './UploadPage';
import ResultsPage from './ResultsPage';

/**
 * Página principal de la aplicación que integra el flujo completo de análisis
 * y visualización del cronometraje industrial de MAFLOWPULSE.
 */
const HomePage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [resultadoAnalisis, setResultadoAnalisis] = useState(null);

  // Callback ejecutado cuando el backend finaliza exitosamente el análisis del video
  const handleAnalisisCompleto = (resultado, file) => {
    setResultadoAnalisis(resultado);
    setVideoFile(file);
  };

  // Permite al usuario reiniciar y analizar un nuevo video o volver atrás
  const handleReiniciar = () => {
    setVideoFile(null);
    setResultadoAnalisis(null);
  };

  return (
    <>
      {!resultadoAnalisis ? (
        <UploadPage onAnalisisCompleto={handleAnalisisCompleto} />
      ) : (
        <ResultsPage
          elementos={resultadoAnalisis.elementos}
          videoFile={videoFile}
          onVolver={handleReiniciar}
        />
      )}
    </>
  );
};

export default HomePage;

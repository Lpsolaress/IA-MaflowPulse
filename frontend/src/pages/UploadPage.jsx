import { useState, useRef, useEffect } from 'react';
import { analizarVideo } from '../services/videoService';

/**
 * Componente funcional React para la página de carga de video de MAFLOWPULSE.
 * Implementa el diseño HTML exacto con Tailwind CSS, y maneja el estado de drag & drop,
 * selección de archivos y la animación del botón de análisis por IA.
 *
 * Props:
 *   onAnalisisCompleto (function): Se ejecuta al hacer clic en analizar,
 *                                  pasando el archivo seleccionado como argumento.
 */
const UploadPage = ({ onAnalisisCompleto }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('idle'); // 'idle' | 'processing' | 'completed'
  const [progressPercent, setProgressPercent] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedFile) {
      setVideoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  useEffect(() => {
    let interval;
    if (analyzeStatus === 'processing') {
      setProgressPercent(0);
      interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 95) return 95;
          const increment = Math.floor(Math.random() * 5) + 2; // Increments of 2-6%
          return Math.min(prev + increment, 95);
        });
      }, 800);
    } else if (analyzeStatus === 'completed') {
      setProgressPercent(100);
    } else {
      setProgressPercent(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analyzeStatus]);

  // Manejar el arrastre sobre la zona del cargador
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
      setSelectedFile(e.dataTransfer.files[0]);
      setAnalyzeStatus('idle'); // Restablecer el estado si se sube un nuevo archivo
    }
  };

  // Activar la selección manual de archivos
  const handleSelectClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setAnalyzeStatus('idle'); // Restablecer el estado al seleccionar un archivo nuevo
    }
  };

  const [error, setError] = useState(null);

  // Iniciar el análisis real del video mediante la API
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzeStatus('processing');
    setError(null);

    try {
      const response = await analizarVideo(selectedFile);
      setAnalyzeStatus('completed');
      if (onAnalisisCompleto) {
        onAnalisisCompleto(response, selectedFile);
      }
    } catch (err) {
      console.error('Error al analizar video:', err);
      setError(err.message || 'Ocurrió un error inesperado al analizar el video.');
      setAnalyzeStatus('idle');
    }
  };

  // Obtener tamaño en MB
  const obtenerTamañoMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#271716] font-body-md">

      {/* TopNavBar */}
      <header className="border-b border-outline-variant flex justify-between items-center w-full px-container-margin py-4 top-0 z-50 bg-[#0A0A0A]">
        <div className="flex items-center gap-8">
          <h1 className="font-display-lg text-[24px] font-black tracking-tighter">
            <span className="text-white">MAFLOW</span><span className="text-industrial-red">PULSE</span>
          </h1>
          <nav className="hidden md:flex items-center gap-6">
            <a className="border-b-2 border-primary font-bold pb-2 font-body-md text-body-md text-white" href="#">
              ELEMENTOS
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-container-margin py-10 max-w-7xl mx-auto w-full">
        {/* Page Title */}
        <div className="mb-10">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight uppercase">
            NUEVO ANÁLISIS
          </h2>
          <div className="w-12 h-1 bg-industrial-red mt-2"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-error-container text-on-error-container rounded-sm flex items-center gap-3 bg-error-container">
            <span className="material-symbols-outlined text-error">error</span>
            <div className="text-left">
              <p className="font-bold">ERROR EN EL ANÁLISIS</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CENTRAL AREA - Video Uploader & File Ready */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Main Uploader Card */}
            <div
              className="uploader-bg rounded-xl p-12 uploader-border flex flex-col items-center justify-center min-h-[400px] text-center group transition-all duration-300 hover:border-industrial-red/50"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleSelectClick}
              style={{
                borderColor: isDragging ? '#E53935' : undefined,
                backgroundColor: isDragging ? '#FFF0EE' : undefined,
                cursor: 'pointer'
              }}
            >
              <input
                type="file"
                className="hidden"
                accept=".mp4,.mov"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="mb-6 relative">
                <span className="material-symbols-outlined text-[80px] text-outline group-hover:text-industrial-red transition-colors">
                  video_library
                </span>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-industrial-red rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-headline-lg text-2xl text-on-surface mb-2 uppercase tracking-wide">
                ARRASTRA TU VIDEO AQUÍ
              </h3>
              <p className="font-body-md text-on-surface-variant mb-8 max-w-xs">
                Formatos aceptados: .mp4 y .mov — Máximo 10 minutos
              </p>
              <button
                type="button"
                className="px-8 py-3 border-2 border-industrial-red text-industrial-red font-bold rounded-lg hover:bg-industrial-red hover:text-white transition-all duration-300 uppercase tracking-widest flex items-center gap-2 active:scale-95"
                onClick={handleSelectClick}
              >
                <span className="material-symbols-outlined">upload_file</span>
                SELECCIONAR ARCHIVO
              </button>
            </div>

            {/* File Ready Section */}
            {selectedFile && (
              <div className="industrial-card rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-industrial-red">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-fixed flex items-center justify-center rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-industrial-red">movie</span>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-on-surface font-bold text-lg">
                        {selectedFile.name}
                      </p>
                      {analyzeStatus === 'idle' && (
                        <button
                          type="button"
                          className="p-1 rounded-full text-outline hover:text-industrial-red hover:bg-red-50 transition-colors flex items-center justify-center"
                          onClick={() => setSelectedFile(null)}
                          title="Quitar video"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm font-data-mono">
                      {obtenerTamañoMB(selectedFile.size)} MB
                    </p>
                  </div>
                </div>

                {/* Botón de Analizar controlado por Estado de React */}
                {analyzeStatus === 'idle' && (
                  <button
                    type="button"
                    className="w-full md:w-auto bg-industrial-red hover:bg-[#D32F2F] text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-industrial-red/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider"
                    onClick={handleAnalyze}
                  >
                    <span className="material-symbols-outlined">psychology</span>
                    ANALIZAR VIDEO CON IA
                  </button>
                )}
                {analyzeStatus === 'processing' && (
                  <button
                    type="button"
                    className="w-full md:w-auto bg-industrial-red text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-industrial-red/20 transition-all flex items-center justify-center gap-3 uppercase tracking-wider opacity-80 cursor-not-allowed"
                    disabled
                  >
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    PROCESANDO...
                  </button>
                )}
                {analyzeStatus === 'completed' && (
                  <button
                    type="button"
                    className="w-full md:w-auto bg-green-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
                    disabled
                  >
                    <span className="material-symbols-outlined">check</span>
                    ANÁLISIS COMPLETADO
                  </button>
                )}
              </div>
            )}
          </div>

          {/* LOADING STATE & INFO AREA */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Loading State Mockup */}
            <div className="industrial-card rounded-xl p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#E53935 0.5px, transparent 0.5px)',
                  backgroundSize: '10px 10px'
                }}
              ></div>
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-[#271716] rounded-full"></div>
                <div className={`absolute inset-0 w-16 h-16 border-4 border-transparent border-t-industrial-red rounded-full ${analyzeStatus === 'processing' ? 'spinner-pulse' : ''}`}></div>
              </div>
              <h4 className="text-on-surface font-bold text-xl mb-2 uppercase tracking-tight">
                {analyzeStatus === 'processing'
                  ? 'ANALIZANDO VIDEO CON IA...'
                  : analyzeStatus === 'completed'
                    ? 'ANÁLISIS COMPLETADO'
                    : 'LISTO PARA ANALIZAR'}
              </h4>
              <p className="text-on-surface-variant text-sm mb-6">
                {analyzeStatus === 'processing'
                  ? 'Esto puede tardar hasta 60 segundos'
                  : analyzeStatus === 'completed'
                    ? 'El análisis se ha realizado con éxito'
                    : 'Sube un video y pulsa "Analizar video con IA"'}
              </p>
              <div className="w-full">
                <div className="flex justify-between mb-2 font-data-mono text-[10px] text-industrial-red uppercase tracking-widest">
                  <span>
                    {analyzeStatus === 'processing'
                      ? 'Procesando Frames'
                      : analyzeStatus === 'completed'
                        ? 'Proceso finalizado'
                        : 'Esperando inicio'}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="progress-bar-container rounded-full">
                  <div
                    style={{
                      position: 'absolute',
                      height: '100%',
                      background: '#E53935',
                      width: `${progressPercent}%`,
                      transition: 'width 0.3s ease-out',
                      left: 0
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Industrial Guidelines Panel */}
            <div className="industrial-card rounded-xl p-6 text-left">
              <h5 className="text-on-surface font-bold mb-4 flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest">
                <span className="material-symbols-outlined text-industrial-red text-sm">info</span>
                Parámetros de Análisis
              </h5>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-outline text-md mt-1">check_circle</span>
                  <p className="text-sm text-on-surface-variant">
                    Detección automática de <span className="text-on-surface font-medium">Tmanual</span> y{' '}
                    <span className="text-on-surface font-medium">Tmaquina</span>.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-outline text-md mt-1">check_circle</span>
                  <p className="text-sm text-on-surface-variant">
                    Identificación de cuellos de botella en tiempo real.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-outline text-md mt-1">check_circle</span>
                  <p className="text-sm text-on-surface-variant">Exportación directa a cronograma industrial.</p>
                </li>
              </ul>
            </div>

            {/* Asset Preview */}
            {selectedFile && videoPreviewUrl && (
              <div className="relative industrial-card rounded-xl aspect-video overflow-hidden group">
                <video
                  src={videoPreviewUrl}
                  className="w-full h-full object-cover"
                  controls
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/90 to-transparent text-left pointer-events-none">
                  <span className="font-data-mono text-[10px] text-on-surface-variant uppercase">
                    VISTA PREVIA DE CAPTURA
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="mt-auto border-t border-outline-variant bg-white px-container-margin py-4 flex flex-col md:flex-row justify-between items-center text-left">
        <div className="flex gap-6 mb-4 md:mb-0">
          <div className="flex flex-col">
          </div>
          <div className="flex flex-col border-l border-outline-variant pl-6">
          </div>
        </div>
        <div className="flex items-center gap-2">        </div>
      </footer>

    </div>
  );
};

export default UploadPage;

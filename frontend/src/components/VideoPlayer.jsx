import { useEffect, useRef, useState } from 'react';

/**
 * Componente reproductor de video MAFLOWPULSE personalizado con controles en pantalla y superposiciones.
 *
 * Props:
 *   videoFile (File): Archivo de video local a reproducir.
 *   segmento (Object): Objeto { inicio, fin, elemento } para reproducción segmentada.
 *   onTiempoChange (function): Callback cuando el tiempo cambia en el video.
 *   onClearSegmento (function): Callback para limpiar el segmento y ver el video completo.
 */
const VideoPlayer = ({ videoFile, segmento = null, onTiempoChange, onClearSegmento }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Crear y limpiar la URL temporal del objeto File
  useEffect(() => {
    if (!videoFile) {
      setVideoSrc('');
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoSrc(url);
    setIsPlaying(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  // Manejar cambios en el segmento (reproducción segmentada)
  useEffect(() => {
    if (segmento && videoRef.current) {
      videoRef.current.currentTime = segmento.inicio;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [segmento]);

  // Manejar el toggle de play/pausa del video real
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            // Manejar fallas de reproducción asíncrona si las hay
            setIsPlaying(false);
          });
      }
    }
  };

  // Escuchar eventos del elemento de video nativo
  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime;
    setCurrentTime(time);

    // Lógica de detención para reproducción segmentada
    if (segmento && time >= segmento.fin) {
      videoRef.current.pause();
      videoRef.current.currentTime = segmento.inicio;
      setIsPlaying(false);
    }

    if (onTiempoChange) {
      onTiempoChange(time);
    }
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // Manejar clics directos sobre la barra de progreso
  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / width));
      
      let newTime;
      if (segmento) {
        const segmentoDuracion = segmento.fin - segmento.inicio;
        newTime = segmento.inicio + (percentage * segmentoDuracion);
      } else if (duration > 0) {
        newTime = percentage * duration;
      }

      if (newTime !== undefined) {
        videoRef.current.currentTime = newTime;
        if (onTiempoChange) {
          onTiempoChange(newTime);
        }
      }
    }
  };

  // Formatear segundos en formato "MM:SS.s"
  const formatearReloj = (segundos) => {
    if (isNaN(segundos) || segundos === null) return '00:00.0';
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    const tenths = Math.floor((segundos % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  };

  // Lógica de visualización de tiempo y progreso
  let displayTime = currentTime;
  let displayDuration = duration;
  let porcentajeProgreso = 0;

  if (segmento) {
    displayTime = Math.max(0, currentTime - segmento.inicio);
    displayDuration = segmento.fin - segmento.inicio;
    porcentajeProgreso = Math.min(100, (displayTime / displayDuration) * 100);
  } else if (duration > 0) {
    porcentajeProgreso = (currentTime / duration) * 100;
  }

  if (!videoFile) {
    return (
      <aside className="w-[40%] flex flex-col bg-on-surface border-l border-on-surface-variant relative overflow-hidden items-center justify-center text-white">
        <p>No se ha cargado ningún archivo de video.</p>
      </aside>
    );
  }

  return (
    <aside className="w-[40%] flex flex-col bg-on-surface border-l border-on-surface-variant relative overflow-hidden shrink-0">
      
      {/* Contenedor del video y overlays */}
      <div className="flex-grow relative bg-black group overflow-hidden">
        
        {/* Elemento de Video Nativo */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover opacity-80"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onClick={togglePlay} // Permite pausar/reproducir haciendo clic en la pantalla
        />

        {/* Video Overlay UI */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          
          {/* Banner Superior (Segmento Activo) */}
          {segmento ? (
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg flex justify-between items-center pointer-events-auto self-start w-full">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold uppercase tracking-widest text-[12px]">{segmento.elemento}</span>
                <span className="text-white/40">|</span>
                <span className="text-[#E53935] font-black font-mono text-[14px]">
                  {(segmento.fin - segmento.inicio).toFixed(1)} SEG
                </span>
              </div>
              <button 
                onClick={onClearSegmento}
                className="text-white/60 hover:text-white text-[10px] font-bold border border-white/20 px-2 py-1 rounded transition-colors"
              >
                VER TODO
              </button>
            </div>
          ) : <div></div>}

          <div className="flex flex-col justify-end pointer-events-none">
            <div className="mb-4">
              
              {/* Header del Overlay */}
              {!segmento && (
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="font-label-sm text-white/70">REC // ANALYZING_LINE_A</span>
                  </div>
                  <span className="font-label-sm text-white/70">1080p | 60 FPS</span>
                </div>
              )}

              {/* Barra de Progreso Interactiva */}
              <div
                ref={progressRef}
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden pointer-events-auto"
                onClick={handleProgressClick}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-75"
                  style={{ width: `${porcentajeProgreso}%` }}
                ></div>
              </div>

            </div>

            {/* Fila de Controles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                
                {/* Botón Play / Pausa */}
                <button
                  type="button"
                  className="text-white hover:text-primary transition-colors flex items-center justify-center pointer-events-auto"
                  onClick={togglePlay}
                >
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                {/* Reloj de tiempo */}
                <div className="flex items-center gap-2 font-label-md select-none pointer-events-auto">
                  <span className="text-white">{formatearReloj(displayTime)}</span>
                  <span className="text-white/40">/</span>
                  <span className="text-white/60">{formatearReloj(displayDuration)}</span>
                </div>
              </div>

              {/* Botones Auxiliares */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-white/70 hover:text-white transition-colors pointer-events-auto cursor-not-allowed opacity-50"
                  disabled
                >
                  <span className="material-symbols-outlined">slow_motion_video</span>
                </button>
                <button
                  type="button"
                  className="text-white/70 hover:text-white transition-colors pointer-events-auto cursor-not-allowed opacity-50"
                  disabled
                >
                  <span className="material-symbols-outlined">fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default VideoPlayer;

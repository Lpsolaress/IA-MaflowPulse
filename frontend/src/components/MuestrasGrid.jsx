import './MuestrasGrid.css';

/**
 * Componente MuestrasGrid
 * 
 * Muestra una cuadrícula horizontal de muestras de cronometraje.
 * 
 * Props:
 * - muestras: Array de objetos {numero, duracion, inicio_video}
 * - onMuestraClick: Callback(inicio_video) al hacer clic en una muestra
 * - onAnadirMuestra: Callback opcional para el botón "+"
 * - onEditMuestra: Callback(muestra) al hacer clic en editar
 * - onDeleteMuestra: Callback(muestra) al hacer clic en eliminar
 */
const MuestrasGrid = ({ 
  muestras = [], 
  onMuestraClick, 
  onAnadirMuestra,
  onEditMuestra,
  onDeleteMuestra
}) => {
  return (
    <div className="muestras-grid-container">
      <div className="muestras-grid-titulo">
        <span className="material-symbols-outlined">timer</span>
        <span>MUESTRAS (SEG.) · {muestras.length}</span>
      </div>

      <div className="muestras-grid-row">
        {/* Muestras con datos */}
        {muestras.map((m, idx) => (
          <div 
            key={idx} 
            className="muestra-box muestra-box-active group"
            onClick={() => onMuestraClick && onMuestraClick(m.inicio_video)}
          >
            <div className="muestra-badge">{m.numero}</div>
            <div className="muestra-duracion">{m.duracion.toFixed(1)}</div>
            
            {/* Acciones de Muestra (visibles en hover) */}
            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMuestra && onEditMuestra(m);
                }}
                className="w-5 h-5 bg-white shadow-sm border border-outline-variant rounded flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMuestra && onDeleteMuestra(m);
                }}
                className="w-5 h-5 bg-white shadow-sm border border-outline-variant rounded flex items-center justify-center text-on-surface-variant hover:text-red-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">delete</span>
              </button>
            </div>
          </div>
        ))}

        {/* Botón Añadir */}
        {onAnadirMuestra && (
          <div className="muestra-box muestra-box-add" onClick={onAnadirMuestra}>
            <span className="muestra-add-icon">+</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MuestrasGrid;

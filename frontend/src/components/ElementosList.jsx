import { useState } from 'react';
import MuestrasGrid from './MuestrasGrid';

/**
 * Componente que muestra la lista de elementos de trabajo identificados en el análisis.
 *
 * Props:
 *   elementos (Array): Lista de objetos de tipo ElementoTrabajo.
 *   elementoSeleccionado (Object): El objeto del elemento de trabajo actualmente activo.
 *   onElementoClick (function): Callback al hacer clic en una tarjeta.
 *   onMuestraClick (function): Callback al hacer clic en una muestra del grid.
 *   onAnadirMuestra: Callback para añadir una muestra manualmente.
 *   onEditMuestra: Callback para editar una muestra.
 *   onDeleteMuestra: Callback para eliminar una muestra.
 *   onExportar (function): Callback al presionar el botón EXPORTAR.
 */
const ElementosList = ({ 
  elementos = [], 
  elementoSeleccionado = null, 
  onElementoClick, 
  onMuestraClick,
  onAnadirMuestra,
  onEditMuestra,
  onDeleteMuestra,
  onExportar, 
  onAddClick, 
  onDeleteClick 
}) => {
  const [expandido, setExpandido] = useState(null);

  // Función auxiliar para determinar la categoría en base a palabras clave de la descripción
  const obtenerCategoria = (descripcion) => {
    const desc = descripcion.toLowerCase();
    if (desc.includes('maquina') || desc.includes('máquina') || desc.includes('hidra') || desc.includes('robot') || desc.includes('cabezal') || desc.includes('prensa')) {
      return 'Tmaquina';
    }
    if (desc.includes('espera') || desc.includes('enfria') || desc.includes('reposo') || desc.includes('pausa')) {
      return 'Tespera';
    }
    return 'Tmanual';
  };

  // Retorna las clases de estilo de Tailwind exactas según la categoría
  const obtenerEstiloCategoria = (categoria) => {
    switch (categoria) {
      case 'Tmaquina':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Tespera':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Tmanual':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <section className="w-[60%] flex flex-col bg-white border-r border-outline-variant text-left">
      {/* List Header Actions */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-outline text-on-surface font-bold text-label-sm hover:bg-surface-container transition-all"
            onClick={onExportar}
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            EXPORTAR
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-6 py-2 bg-on-surface text-white font-bold text-label-sm hover:bg-primary transition-all rounded-sm cursor-pointer"
          onClick={onAddClick}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          +ELEMENTO
        </button>
      </header>

      {/* Scrollable List */}
      <div className="flex-grow overflow-y-auto custom-scroll p-4 bg-surface-container-lowest">
        <div className="space-y-3">
          {elementos.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-md">
              No hay elementos identificados.
            </div>
          ) : (
            elementos.map((elem) => {
              const categoria = obtenerCategoria(elem.elemento);
              const estiloCategoria = obtenerEstiloCategoria(categoria);
              const esActivo = elementoSeleccionado && elementoSeleccionado.numero === elem.numero;
              const estaExpandido = expandido === elem.numero;
              const tieneMultiplesMuestras = elem.muestras.length > 1;

              const handleCardClick = () => {
                if (!tieneMultiplesMuestras) {
                  onElementoClick && onElementoClick(elem);
                  return;
                }

                if (estaExpandido) {
                  setExpandido(null);
                } else {
                  setExpandido(elem.numero);
                  onElementoClick && onElementoClick(elem);
                }
              };

              return (
                <div key={elem.numero} className="flex flex-col">
                  <div
                    className={`flex items-center p-4 border border-outline-variant hover:bg-surface-container transition-all ${tieneMultiplesMuestras ? 'cursor-pointer' : 'cursor-default'} ${esActivo
                        ? 'border-l-[3px] border-l-primary bg-white shadow-sm'
                        : 'bg-surface-container-low'
                      }`}
                    onClick={handleCardClick}
                  >
                    {/* Número y Muestras Count */}
                    <div className="w-16 flex flex-col">
                      <div className="text-on-surface-variant font-label-md">
                        {String(elem.numero).padStart(2, '0')}
                      </div>
                      {tieneMultiplesMuestras && (
                        <div className="text-[10px] text-outline-variant font-medium">
                          {elem.muestras.length} muestras
                        </div>
                      )}
                    </div>

                    {/* Cuerpo de la tarjeta */}
                    <div className="flex-grow">
                      <h3 className="font-headline-md text-[16px] leading-tight mb-1 text-on-surface">
                        {elem.elemento}
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="font-label-sm text-outline">
                          ID: {String(elem.numero).padStart(2, '0')}-MC
                        </span>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${estiloCategoria}`}>
                            {categoria}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tiempo y Acciones */}
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className="text-right">
                        <span className="font-display-lg text-[24px] font-black block leading-none text-on-surface">
                          {(tieneMultiplesMuestras ? elem.duracion_promedio : elem.muestras[0].duracion).toFixed(1)}
                          <span className="text-[12px] font-medium text-on-surface-variant ml-1 font-body-md">SEG</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick && onDeleteClick(elem);
                          }}
                          title="Eliminar elemento"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Muestras Expandible - Solo se muestra si hay más de 1 muestra (repetición) */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${estaExpandido && elem.muestras.length > 1 ? 'max-h-[500px] opacity-100 py-2' : 'max-h-0 opacity-0'}`}>
                    {elem.muestras.length > 1 && (
                      <MuestrasGrid 
                        muestras={elem.muestras} 
                        onMuestraClick={(inicio_video) => {
                          const muestra = elem.muestras.find(m => m.inicio_video === inicio_video);
                          onMuestraClick && onMuestraClick(muestra, elem);
                        }} 
                        onAnadirMuestra={() => onAnadirMuestra && onAnadirMuestra(elem)}
                        onEditMuestra={(muestra) => onEditMuestra && onEditMuestra(muestra, elem)}
                        onDeleteMuestra={(muestra) => onDeleteMuestra && onDeleteMuestra(muestra, elem)}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <footer className="h-14 bg-on-surface flex items-center px-8 gap-12 shrink-0 select-none">
        <div className="flex items-center gap-2">
        </div>
        <div className="w-px h-6 bg-outline-variant/20"></div>
        <div className="flex items-center gap-2">
        </div>
      </footer>
    </section>
  );
};

export default ElementosList;

import { useState } from 'react';
import ElementosList from '../components/ElementosList';
import VideoPlayer from '../components/VideoPlayer';
import ElementoModal from '../components/ElementoModal';
import MuestraModal from '../components/MuestraModal';
import { exportarExcel } from '../services/videoService';

/**
 * Pantalla de resultados del análisis de cronometraje industrial MAFLOWPULSE.
 *
 * Props:
 *   elementos (Array): Listado de elementos de trabajo devueltos por la API de Gemini.
 *   videoFile (File): Archivo de video local analizado.
 *   onVolver (function): Callback opcional para volver a la pantalla de carga.
 */
const ResultsPage = ({ elementos = [], videoFile, onVolver }) => {
  const [elementosList, setElementosList] = useState(elementos);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [segmento, setSegmento] = useState(null);
  
  // Estados para el Modal de Agregar/Editar Elemento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [elementoParaEditar, setElementoParaEditar] = useState(null);

  // Estados para el Modal de Muestras
  const [isMuestraModalOpen, setIsMuestraModalOpen] = useState(false);
  const [muestraParaEditar, setMuestraParaEditar] = useState(null);
  const [elementoPadreDeMuestra, setElementoPadreDeMuestra] = useState(null);

  // Auxiliar para ordenar y renumerar secuencialmente
  const reordenarYRenumerar = (lista) => {
    return [...lista]
      .sort((a, b) => a.inicio - b.inicio)
      .map((item, index) => ({
        ...item,
        numero: index + 1
      }));
  };

  // Manejar cambio de tiempo del reproductor
  const handleTiempoChange = (nuevoTiempo) => {
    // Sincronizar selección de tarjeta en base al tiempo actual del video
    const elementoActivo = elementosList.find(
      (elem) => {
        return elem.muestras.some(m => nuevoTiempo >= m.inicio_video && nuevoTiempo <= (m.inicio_video + m.duracion));
      }
    );
    if (elementoActivo && (!elementoSeleccionado || elementoSeleccionado.numero !== elementoActivo.numero)) {
      setElementoSeleccionado(elementoActivo);
    }
  };

  // Manejar clic en una tarjeta de la lista
  const handleElementoClick = (elemento) => {
    setElementoSeleccionado(elemento);
    if (elemento.muestras && elemento.muestras.length > 0) {
      setSegmento({
        inicio: elemento.muestras[0].inicio_video,
        fin: elemento.muestras[0].inicio_video + elemento.duracion_promedio,
        elemento: elemento.elemento
      });
    }
  };

  // Manejar clic en una muestra individual
  const handleMuestraClick = (muestra, elemento) => {
    setSegmento({
      inicio: muestra.inicio_video,
      fin: muestra.inicio_video + muestra.duracion,
      elemento: `${elemento.elemento} — Muestra ${muestra.numero}`
    });
  };

  const handleClearSegmento = () => {
    setSegmento(null);
  };

  // Exportar los datos a formato Excel llamando al servicio del backend
  const handleExportar = async () => {
    try {
      const response = await exportarExcel(elementosList);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cronometraje_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel: ' + error.message);
    }
  };

  // Guardar un elemento (ya sea nuevo o editado)
  const handleSaveElement = (nuevoElemento) => {
    let nuevaLista = [...elementosList];
    
    if (elementoParaEditar) {
      // Modificar existente
      nuevaLista = nuevaLista.map((elem) => 
        elem.numero === elementoParaEditar.numero ? { ...elem, ...nuevoElemento } : elem
      );
    } else {
      // Agregar nuevo
      nuevaLista.push(nuevoElemento);
    }

    const listaOrdenada = reordenarYRenumerar(nuevaLista);
    setElementosList(listaOrdenada);

    // Si el elemento seleccionado se modificó, actualizar la selección
    if (elementoSeleccionado) {
      const activoActualizado = listaOrdenada.find(
        (elem) => elem.numero === elementoSeleccionado.numero
      );
      setElementoSeleccionado(activoActualizado || null);
    }
  };

  // Eliminar un elemento de la lista
  const handleDeleteElement = (elemento) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el elemento "${elemento.elemento}"?`)) {
      const nuevaLista = elementosList.filter((elem) => elem.numero !== elemento.numero);
      const listaOrdenada = reordenarYRenumerar(nuevaLista);
      setElementosList(listaOrdenada);
      
      if (elementoSeleccionado && elementoSeleccionado.numero === elemento.numero) {
        setElementoSeleccionado(null);
      }
    }
  };

  const handleAddClick = () => {
    setElementoParaEditar(null);
    setIsModalOpen(true);
  };

  // --- Manejo de Muestras Individuales ---

  const handleAnadirMuestraClick = (elemento) => {
    setElementoPadreDeMuestra(elemento);
    setMuestraParaEditar(null);
    setIsMuestraModalOpen(true);
  };

  const handleEditMuestraClick = (muestra, elemento) => {
    setElementoPadreDeMuestra(elemento);
    setMuestraParaEditar(muestra);
    setIsMuestraModalOpen(true);
  };

  const handleDeleteMuestra = (muestra, elemento) => {
    if (window.confirm(`¿Eliminar la muestra ${muestra.numero} del elemento "${elemento.elemento}"?`)) {
      const nuevaLista = elementosList.map((el) => {
        if (el.numero === elemento.numero) {
          const nuevasMuestras = el.muestras
            .filter((m) => m.numero !== muestra.numero)
            .map((m, idx) => ({ ...m, numero: idx + 1 }));
          
          const nuevaDuracionPromedio = nuevasMuestras.length > 0
            ? nuevasMuestras.reduce((sum, m) => sum + m.duracion, 0) / nuevasMuestras.length
            : 0;

          return { ...el, muestras: nuevasMuestras, duracion_promedio: nuevaDuracionPromedio };
        }
        return el;
      });
      setElementosList(nuevaLista);
    }
  };

  const handleSaveMuestra = (nuevaMuestra) => {
    const nuevaLista = elementosList.map((el) => {
      if (el.numero === elementoPadreDeMuestra.numero) {
        let nuevasMuestras = [...el.muestras];
        
        if (muestraParaEditar) {
          // Editar existente
          nuevasMuestras = nuevasMuestras.map((m) => 
            m.numero === muestraParaEditar.numero ? { ...m, ...nuevaMuestra } : m
          );
        } else {
          // Añadir nueva
          nuevasMuestras.push({
            ...nuevaMuestra,
            numero: nuevasMuestras.length + 1
          });
        }

        // Ordenar muestras por inicio de video
        nuevasMuestras.sort((a, b) => a.inicio_video - b.inicio_video);
        // Renumerar
        nuevasMuestras = nuevasMuestras.map((m, idx) => ({ ...m, numero: idx + 1 }));

        const nuevaDuracionPromedio = nuevasMuestras.reduce((sum, m) => sum + m.duracion, 0) / nuevasMuestras.length;

        return { ...el, muestras: nuevasMuestras, duracion_promedio: nuevaDuracionPromedio };
      }
      return el;
    });

    setElementosList(nuevaLista);
  };

  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary selection:text-white h-screen flex flex-col overflow-hidden text-left w-full">
      {/* Top Navigation Bar */}
      <nav className="bg-on-surface text-white flex justify-between items-center w-full px-8 py-3 border-b border-outline-variant z-50 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-baseline cursor-pointer" onClick={onVolver}>
            <span className="font-display-lg text-[24px] font-black tracking-tight">MAFLOW</span><span className="font-display-lg text-[24px] font-black tracking-tight text-[#E53935]">PULSE</span>
          </div>
          <div className="flex items-center gap-2 font-label-sm text-outline-variant">
            <span>PANEL</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-white font-bold">[DEMO]</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
         
        </div>
      </nav>

      {/* Sub-navigation Tabs */}
      <div className="bg-surface-container-lowest flex items-end px-8 border-b border-outline-variant shrink-0">
        <div className="flex gap-8 h-12 items-end">
          <button type="button" className="flex items-center gap-2 text-primary border-b-2 border-primary font-bold pb-3 px-1 transition-all">
            <span className="font-body-md">ELEMENTOS</span>
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-label-sm">{elementosList.length}</span>
          </button>
          <button type="button" className="flex items-center gap-2 text-on-surface-variant font-medium pb-3 px-1 hover:text-primary transition-colors">
            <span className="font-body-md">CRONOGRAMA</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex overflow-hidden">
        <ElementosList
          elementos={elementosList}
          elementoSeleccionado={elementoSeleccionado}
          onElementoClick={handleElementoClick}
          onMuestraClick={handleMuestraClick}
          onAnadirMuestra={handleAnadirMuestraClick}
          onEditMuestra={handleEditMuestraClick}
          onDeleteMuestra={handleDeleteMuestra}
          onExportar={handleExportar}
          onAddClick={handleAddClick}
          onDeleteClick={handleDeleteElement}
        />
        <VideoPlayer
          videoFile={videoFile}
          segmento={segmento}
          onTiempoChange={handleTiempoChange}
          onClearSegmento={handleClearSegmento}
        />
      </main>

      {/* Summary Footer */}
      <footer className="h-14 bg-on-surface flex items-center px-8 gap-12 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-outline-variant text-[11px] font-label-sm uppercase tracking-widest">TOTAL ELEMENTOS:</span>
          <span className="text-white font-bold font-label-md">{elementosList.length}</span>
        </div>
        <div className="w-px h-6 bg-outline-variant/20"></div>
        <div className="flex items-center gap-2">
          <span className="text-outline-variant text-[11px] font-label-sm uppercase tracking-widest">TOTAL MUESTRAS:</span>
          <span className="text-white font-bold font-label-md">
            {elementosList.reduce((sum, item) => sum + (item.muestras?.length || 0), 0)}
          </span>
        </div>
        <div className="w-px h-6 bg-outline-variant/20"></div>
        <div className="flex items-center gap-2">
          <span className="text-outline-variant text-[11px] font-label-sm uppercase tracking-widest">DURACIÓN PROMEDIO CICLO:</span>
          <span className="text-white font-bold font-label-md">
            {(elementosList.length > 0 
              ? elementosList.reduce((sum, item) => sum + (item.duracion_promedio || 0), 0) / elementosList.length 
              : 0
            ).toFixed(1)} seg
          </span>
        </div>
      </footer>

      {/* Modal de Agregar / Editar Elemento */}
      <ElementoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveElement}
        elemento={elementoParaEditar}
      />
      {/* Modal de Agregar / Editar Muestra */}
      <MuestraModal
        isOpen={isMuestraModalOpen}
        onClose={() => setIsMuestraModalOpen(false)}
        onSave={handleSaveMuestra}
        muestra={muestraParaEditar}
        elementoNombre={elementoPadreDeMuestra?.elemento}
      />
    </div>
  );
};

export default ResultsPage;

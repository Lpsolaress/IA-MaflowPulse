import { useState } from 'react';
import { exportarExcel } from '../services/videoService';
import './TablaElementos.css';

/**
 * Tabla interactiva que presenta los elementos de trabajo del cronometraje industrial.
 *
 * Props:
 *   elementos (Array): Lista de objetos ElementoTrabajo provenientes del análisis.
 *   currentTime (number): Tiempo actual de reproducción del video.
 *   onElementoClick (function): Callback al hacer clic en una fila (pasa el segundo de inicio).
 */
const TablaElementos = ({ elementos = [], currentTime = 0, onElementoClick }) => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Calcular la duración total acumulada de los elementos
  const duracionTotal = elementos.reduce((acumulador, elem) => acumulador + elem.duracion, 0);

  // Determinar si una fila está activa en base al tiempo actual de reproducción
  const esFilaActiva = (inicio, fin) => {
    return currentTime >= inicio && currentTime < fin;
  };

  // Formatear segundos con un decimal de precisión
  const formatearTiempo = (segundos) => {
    return `${Number(segundos).toFixed(1)}s`;
  };

  // Manejar el proceso de exportación a Excel
  const handleExportar = async () => {
    setExporting(true);
    setExportError('');

    try {
      const response = await exportarExcel(elementos);
      
      // Intentar extraer el nombre del archivo desde las cabeceras expuestas
      const contentDisposition = response.headers['content-disposition'];
      let filename = `cronometraje_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Crear un enlace de descarga temporal y simular el clic para descargar el archivo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      
      link.click();
      
      // Limpiar recursos
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || 'Ocurrió un error inesperado al intentar exportar los datos.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="tabla-elementos-container">
      <table className="tabla-elementos">
        <thead>
          <tr>
            <th className="col-num">N°</th>
            <th className="col-elemento">Elemento</th>
            <th className="col-tiempo">Inicio</th>
            <th className="col-tiempo">Fin</th>
            <th className="col-tiempo">Duración</th>
          </tr>
        </thead>
        <tbody>
          {elementos.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlignment: 'center', padding: '2rem', color: 'var(--text)' }}>
                No hay elementos identificados. Sube un video para comenzar.
              </td>
            </tr>
          ) : (
            elementos.map((elem) => {
              const activa = esFilaActiva(elem.inicio, elem.fin);
              return (
                <tr
                  key={elem.numero}
                  className={activa ? 'fila-activa' : ''}
                  onClick={() => onElementoClick && onElementoClick(elem.inicio)}
                >
                  <td className="col-num">{elem.numero}</td>
                  <td className="col-elemento">{elem.elemento}</td>
                  <td className="col-tiempo">{formatearTiempo(elem.inicio)}</td>
                  <td className="col-tiempo">{formatearTiempo(elem.fin)}</td>
                  <td className="col-tiempo">{formatearTiempo(elem.duracion)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pie de tabla con datos consolidados y acciones */}
      <div className="tabla-pie">
        <div className="tabla-pie-dato">
          <span>Total elementos:</span>
          <span className="tabla-pie-valor">{elementos.length}</span>
        </div>
        <div className="tabla-pie-dato">
          <span>Duración acumulada:</span>
          <span className="tabla-pie-valor">{formatearTiempo(duracionTotal)}</span>
        </div>
        {elementos.length > 0 && (
          <button
            type="button"
            className="btn-exportar"
            onClick={handleExportar}
            disabled={exporting}
            title="Exportar estos elementos de cronometraje a un archivo Excel (.xlsx)"
          >
            {exporting ? (
              <>
                <span className="spinner-mini"></span>
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  style={{ width: '16px', height: '16px' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                <span>Exportar a Excel</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Mostrar error si falla la exportación */}
      {exportError && (
        <p className="tabla-export-error">{exportError}</p>
      )}
    </div>
  );
};

export default TablaElementos;


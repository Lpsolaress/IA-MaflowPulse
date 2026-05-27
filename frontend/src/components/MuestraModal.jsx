import { useState, useEffect } from 'react';

/**
 * Modal para agregar o editar una muestra individual de un elemento de trabajo.
 */
const MuestraModal = ({ isOpen, onClose, onSave, muestra = null, elementoNombre = '' }) => {
  const [formData, setFormData] = useState({
    inicio_video: 0,
    duracion: 0
  });

  useEffect(() => {
    if (!isOpen) return;
    
    if (muestra) {
      setFormData({
        inicio_video: Number(muestra.inicio_video) || 0,
        duracion: Number(muestra.duracion) || 0
      });
    } else {
      setFormData({
        inicio_video: 0,
        duracion: 0
      });
    }
  }, [muestra, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = Math.max(0, parseFloat(value) || 0);
    setFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      numero: muestra ? muestra.numero : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-xs bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col text-left transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 bg-on-surface text-white flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {muestra ? 'Editar Muestra' : 'Nueva Muestra'}
          </h3>
          <button onClick={onClose} className="text-white/75 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest">
            Elemento: {elementoNombre}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-outline">Inicio (s)</label>
              <input
                type="number"
                name="inicio_video"
                value={formData.inicio_video}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-outline rounded bg-surface focus:border-industrial-red focus:outline-none font-mono text-sm"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-outline">Duración (s)</label>
              <input
                type="number"
                name="duracion"
                value={formData.duracion}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-outline rounded bg-surface focus:border-industrial-red focus:outline-none font-mono text-sm"
                required
              />
            </div>
          </div>

          <footer className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-bold uppercase hover:bg-surface-container rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-industrial-red text-white text-[11px] font-bold uppercase rounded shadow-sm hover:shadow-md transition-all"
            >
              {muestra ? 'Guardar' : 'Añadir'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default MuestraModal;

import { useState, useEffect } from 'react';

/**
 * Componente modal para agregar y editar elementos de cronometraje manuales.
 * Sincroniza dinámicamente los campos de inicio, fin y duración para consistencia.
 *
 * Props:
 *   isOpen (boolean): Indica si el modal está visible.
 *   onClose (function): Callback al cerrar el modal.
 *   onSave (function): Callback al enviar el formulario con los datos validados.
 *   elemento (Object, optional): Elemento a editar (si es null, el modal actúa en modo "Agregar").
 */
const ElementoModal = ({ isOpen, onClose, onSave, elemento = null }) => {
  const [formData, setFormData] = useState({
    elemento: '',
    inicio: 0,
    fin: 0,
    duracion: 0
  });
  const [error, setError] = useState('');

  // Sincronizar formulario con el elemento a editar o vaciar si es nuevo
  useEffect(() => {
    if (elemento) {
      setFormData({
        elemento: elemento.elemento || '',
        inicio: Number(elemento.inicio) || 0,
        fin: Number(elemento.fin) || 0,
        duracion: Number(elemento.duracion) || 0
      });
    } else {
      setFormData({
        elemento: '',
        inicio: 0,
        fin: 0,
        duracion: 0
      });
    }
    setError('');
  }, [elemento, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');

    if (name === 'elemento') {
      setFormData((prev) => ({ ...prev, elemento: value }));
    } else {
      const numValue = Math.max(0, parseFloat(value) || 0);

      setFormData((prev) => {
        let updated = { ...prev, [name]: numValue };

        if (name === 'inicio') {
          // Si cambia el inicio, recalculamos la duración manteniendo el fin
          if (updated.fin < numValue) {
            updated.fin = numValue;
          }
          updated.duracion = Number((updated.fin - numValue).toFixed(1));
        } else if (name === 'fin') {
          // Si cambia el fin, aseguramos que fin >= inicio y recalculamos duración
          if (numValue < updated.inicio) {
            updated.inicio = numValue;
          }
          updated.duracion = Number((numValue - updated.inicio).toFixed(1));
        } else if (name === 'duracion') {
          // Si cambia la duración, recalculamos el fin: fin = inicio + duracion
          updated.fin = Number((updated.inicio + numValue).toFixed(1));
        }

        return updated;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.elemento.trim()) {
      setError('La descripción del elemento es requerida.');
      return;
    }

    if (formData.fin < formData.inicio) {
      setError('El tiempo de fin no puede ser menor que el tiempo de inicio.');
      return;
    }

    onSave({
      ...formData,
      elemento: formData.elemento.trim(),
      numero: elemento ? elemento.numero : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col text-left transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-4 bg-on-surface text-white flex justify-between items-center">
          <h3 className="text-lg font-bold uppercase tracking-wider font-headline-lg">
            {elemento ? 'Editar Elemento' : 'Nuevo Elemento Manual'}
          </h3>
          <button 
            type="button" 
            className="text-white/75 hover:text-white transition-colors cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-900 rounded border border-red-200 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Elemento / Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-sm">
              Descripción del Elemento
            </label>
            <input
              type="text"
              name="elemento"
              value={formData.elemento}
              onChange={handleChange}
              placeholder="Ej. Coger pieza de caja"
              maxLength={100}
              className="w-full px-3 py-2 border border-outline rounded-lg bg-surface hover:border-industrial-red/50 focus:border-industrial-red focus:outline-none transition-colors text-on-surface font-body-md"
              required
            />
          </div>

          {/* Grid de Tiempos */}
          <div className="grid grid-cols-3 gap-3">
            {/* Inicio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-sm">
                Inicio (s)
              </label>
              <input
                type="number"
                name="inicio"
                value={formData.inicio}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-outline rounded-lg bg-surface hover:border-industrial-red/50 focus:border-industrial-red focus:outline-none transition-colors text-on-surface font-data-mono"
                required
              />
            </div>

            {/* Fin */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-sm">
                Fin (s)
              </label>
              <input
                type="number"
                name="fin"
                value={formData.fin}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-outline rounded-lg bg-surface hover:border-industrial-red/50 focus:border-industrial-red focus:outline-none transition-colors text-on-surface font-data-mono"
                required
              />
            </div>

            {/* Duración */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-sm">
                Duración (s)
              </label>
              <input
                type="number"
                name="duracion"
                value={formData.duracion}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-outline rounded-lg bg-surface hover:border-industrial-red/50 focus:border-industrial-red focus:outline-none transition-colors text-on-surface font-data-mono"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="mt-4 pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline text-on-surface font-bold text-label-sm hover:bg-surface-container transition-all rounded-lg uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-industrial-red hover:bg-[#D32F2F] text-white font-bold text-label-sm transition-all rounded-lg uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              {elemento ? 'Guardar' : 'Añadir'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ElementoModal;

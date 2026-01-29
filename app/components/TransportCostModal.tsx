"use client";
import { useState, useEffect } from 'react';
import { TransportLog } from '../types';

interface TransportCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cost: number, description?: string) => Promise<void> | void;
  companyName: string;
  selectedDate: string;
  existingTransport?: TransportLog;
}

export default function TransportCostModal({
  isOpen,
  onClose,
  onSave,
  companyName,
  selectedDate,
  existingTransport,
}: TransportCostModalProps) {
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form with existing data when modal opens
  useEffect(() => {
    if (isOpen && existingTransport) {
      setCost(existingTransport.tripCost.toString());
      setDescription(existingTransport.description || '');
    } else if (isOpen && !existingTransport) {
      // Reset form for new entry
      setCost('');
      setDescription('');
      setError('');
    }
  }, [isOpen, existingTransport]);

  if (!isOpen) return null;

  const displayDate = new Date(selectedDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const handleSave = async () => {
    // Validate numeric input with 2 decimals
    const numericValue = parseFloat(cost);

    if (isNaN(numericValue)) {
      setError('Por favor ingresa un valor numérico válido');
      return;
    }

    if (numericValue < 0) {
      setError('El costo no puede ser negativo');
      return;
    }

    // Round to 2 decimals
    const roundedValue = Math.round(numericValue * 100) / 100;

    setIsSubmitting(true);
    await onSave(roundedValue, description.trim() || undefined);
    setIsSubmitting(false);

    // Reset form
    setCost('');
    setDescription('');
    setError('');
  };

  const handleCostChange = (value: string) => {
    setCost(value);
    setError('');
  };

  const handleClose = () => {
    setCost('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-xl font-bold mb-1">
          💸 {existingTransport ? 'Actualizar' : 'Registrar'} Costo de Movilidad
        </h3>
        <p className="text-sm text-gray-500 mb-1">{companyName}</p>
        <p className="text-xs text-gray-400 mb-4 capitalize">{displayDate}</p>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Monto (S/.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => handleCostChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 rounded border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Taxi, Bus, etc."
              className="w-full px-4 py-2 rounded border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!cost || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <span className="animate-spin">⏳</span>}
            {existingTransport ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

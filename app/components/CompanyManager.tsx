import { useState } from 'react';
import { Company } from '../types';

interface CompanyManagerProps {
  companies: Company[];
  onAddCompany: (company: Company) => void;
  onUpdateCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onResetPayments: (id: string) => void;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
];

export default function CompanyManager({ companies, onAddCompany, onUpdateCompany, onDeleteCompany, onResetPayments }: CompanyManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !hourlyRate) return;

    if (editingId) {
       // Update existing
       const existingCompany = companies.find(c => c.id === editingId);
       if (existingCompany) {
           onUpdateCompany({
               ...existingCompany,
               name,
               locationLink,
               hourlyRate: parseFloat(hourlyRate)
           });
       }
       setEditingId(null);
    } else {
        // Add new
        // Pick a random color
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        const newCompany: Company = {
        id: crypto.randomUUID(),
        name,
        locationLink,
        hourlyRate: parseFloat(hourlyRate),
        color,
        };
        onAddCompany(newCompany);
    }

    setName('');
    setLocationLink('');
    setHourlyRate('');
  };

  const startEditing = (company: Company) => {
      setName(company.name);
      setLocationLink(company.locationLink);
      setHourlyRate(company.hourlyRate.toString());
      setEditingId(company.id);
      setIsOpen(true); // Ensure form is visible
  };

  const cancelEditing = () => {
      setName('');
      setLocationLink('');
      setHourlyRate('');
      setEditingId(null);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow p-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-lg font-bold mb-2"
      >
        <span>🏢 Administrar Empresas</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de Empresa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarifa por Hora (S/.)</label>
              <input
                type="number"
                step="0.1"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ubicación (Link)</label>
              <input
                type="url"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
                placeholder="https://maps.google.com..."
              />
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    className={`flex-1 text-white py-2 rounded transition ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {editingId ? 'Actualizar Empresa' : 'Agregar Empresa'}
                </button>
                {editingId && (
                    <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                        Cancelar
                    </button>
                )}
            </div>
          </form>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Mis Empresas</h3>
            {companies.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay empresas agregadas.</p>
            ) : (
              <ul className="space-y-2">
                {companies.map((company) => (
                  <li key={company.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                    <div className="flex items-center gap-3">
                         <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: company.color || '#3b82f6' }}
                         />
                         <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              S/. {company.hourlyRate}/hr
                              {company.locationLink && (
                                <a
                                  href={company.locationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-500 hover:underline"
                                >
                                  Mapa
                                </a>
                              )}
                            </div>
                            <button
                               onClick={() => {
                                   if(confirm('¿Estás seguro de reiniciar los pagos pendientes para ' + company.name + '?')) {
                                       onResetPayments(company.id);
                                   }
                               }}
                               className="mt-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60 transition-colors active:scale-95 touch-manipulation"
                            >
                                Reiniciar Pagos
                            </button>
                         </div>
                    </div>
                    <div className="flex flex-col gap-6 pl-4 border-l dark:border-zinc-700 ml-2">
                        <button
                            onClick={() => startEditing(company)}
                            className="text-gray-500 hover:text-blue-500 p-2 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                            title="Editar empresa"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar la empresa "${company.name}"? Se eliminarán también los registros de horas registrados para ella de la vista.`)) {
                                    onDeleteCompany(company.id);
                                }
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 dark:hover:bg-zinc-700 transition"
                            title="Eliminar empresa"
                        >
                            ✕
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

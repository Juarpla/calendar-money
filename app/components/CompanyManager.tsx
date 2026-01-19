import { useState } from 'react';
import { Company } from '../types';

interface CompanyManagerProps {
  companies: Company[];
  onAddCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
}

export default function CompanyManager({ companies, onAddCompany, onDeleteCompany }: CompanyManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !hourlyRate) return;

    const newCompany: Company = {
      id: crypto.randomUUID(),
      name,
      locationLink,
      hourlyRate: parseFloat(hourlyRate),
    };

    onAddCompany(newCompany);
    setName('');
    setLocationLink('');
    setHourlyRate('');
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow p-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-lg font-bold mb-2"
      >
        <span>🏢 Manage Companies</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
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
              <label className="block text-sm font-medium mb-1">Location (Link)</label>
              <input
                type="url"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
                className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
                placeholder="https://maps.google.com..."
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Add Company
            </button>
          </form>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">My Companies</h3>
            {companies.length === 0 ? (
              <p className="text-gray-500 text-sm">No companies added yet.</p>
            ) : (
              <ul className="space-y-2">
                {companies.map((company) => (
                  <li key={company.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ${company.hourlyRate}/hr
                        {company.locationLink && (
                          <a
                            href={company.locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500 hover:underline"
                          >
                            Map
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteCompany(company.id)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
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

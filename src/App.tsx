import React, { useState, useMemo } from 'react';
import { Upload, Download, Plus, Trash2, Search, SortAsc } from 'lucide-react';
import type { Vehicle } from './types';
import { parseVehiclesLua, generateVehiclesLua } from './utils';

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'none' | 'category'>('none');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    
    if (!file) {
      setError('No file selected');
      return;
    }

    if (!file.name.endsWith('.lua')) {
      setError('Please select a .lua file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          setError('File is empty');
          return;
        }
        
        const parsedVehicles = parseVehiclesLua(content);
        if (parsedVehicles.length === 0) {
          setError('No vehicles found in the file. Make sure the file format is correct.');
          return;
        }
        
        setVehicles(parsedVehicles);
      } catch (err) {
        setError('Error reading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (vehicles.length === 0) {
      setError('No vehicles to download');
      return;
    }

    const content = generateVehiclesLua(vehicles);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicles.lua';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addNewVehicle = () => {
    setVehicles([{
      model: '',
      name: '',
      brand: '',
      price: 0,
      categoryLabel: '',
      shop: ''
    }, ...vehicles]);
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: string | number) => {
    const updatedVehicles = [...vehicles];
    updatedVehicles[index] = {
      ...updatedVehicles[index],
      [field]: value
    };
    setVehicles(updatedVehicles);
  };

  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const filteredAndSortedVehicles = useMemo(() => {
    let result = [...vehicles];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(vehicle => 
        vehicle.name.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.brand.toLowerCase().includes(query) ||
        vehicle.categoryLabel.toLowerCase().includes(query) ||
        vehicle.shop.toString().toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === 'category') {
      result.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
    }

    return result;
  }, [vehicles, searchQuery, sortBy]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(vehicles.map(v => v.categoryLabel));
    return Array.from(categories).filter(Boolean).sort();
  }, [vehicles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-gray-900">QBCore Vehicle Manager</h1>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <Upload size={20} />
                Upload vehicles.lua
                <input
                  type="file"
                  accept=".lua"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={handleDownload}
                disabled={vehicles.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={20} />
                Download vehicles.lua
              </button>

              <button
                onClick={addNewVehicle}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                Add New Vehicle
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <SortAsc className="text-gray-400" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'none' | 'category')}
                className="rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">Sort by...</option>
                <option value="category">Category</option>
              </select>
            </div>

            {uniqueCategories.length > 0 && (
              <div className="w-full flex flex-wrap gap-2">
                {uniqueCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSearchQuery(category)}
                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            {filteredAndSortedVehicles.map((vehicle, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <input
                        type="text"
                        value={vehicle.model}
                        onChange={(e) => updateVehicle(index, 'model', e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., adder"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={vehicle.name}
                        onChange={(e) => updateVehicle(index, 'name', e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., Adder"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={vehicle.brand}
                        onChange={(e) => updateVehicle(index, 'brand', e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., Truffade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        value={vehicle.price}
                        onChange={(e) => updateVehicle(index, 'price', parseInt(e.target.value))}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., 500000"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category Label</label>
                      <input
                        type="text"
                        value={vehicle.categoryLabel}
                        onChange={(e) => updateVehicle(index, 'categoryLabel', e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., Super"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
                      <input
                        type="text"
                        value={vehicle.shop}
                        onChange={(e) => updateVehicle(index, 'shop', e.target.value)}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        placeholder="e.g., pdm, luxury, bikes"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeVehicle(index)}
                  className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Remove Vehicle
                </button>
              </div>
            ))}

            {filteredAndSortedVehicles.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {vehicles.length === 0 
                  ? "No vehicles added yet. Click \"Add New Vehicle\" to get started or upload a vehicles.lua file."
                  : "No vehicles match your search criteria."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Calendar, Plus, CheckCircle2, Clock, AlertCircle, 
  Trash2, Syringe, Filter, Check, Info 
} from 'lucide-react';
import { MASTER_VACCINATION_SCHEDULE, DEFAULT_BATCHES } from '../data/vaccineData';

export default function Vaccines() {
  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('poulcare_vaccine_batches');
    return saved ? JSON.parse(saved) : DEFAULT_BATCHES;
  });

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newBatchName, setNewBatchName] = useState('');
  const [newFlockType, setNewFlockType] = useState('Layers');
  const [newFlockSize, setNewFlockSize] = useState(500);
  const [newHatchDate, setNewHatchDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Schedule Table Filter
  const [scheduleFilter, setScheduleFilter] = useState('All');

  useEffect(() => {
    localStorage.setItem('poulcare_vaccine_batches', JSON.stringify(batches));
  }, [batches]);

  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    const newBatch = {
      id: `batch-${Date.now()}`,
      name: newBatchName.trim(),
      flockType: newFlockType,
      flockSize: parseInt(newFlockSize) || 100,
      hatchDate: newHatchDate,
      completedVaccines: []
    };

    const updated = [...batches, newBatch];
    setBatches(updated);
    setSelectedBatchId(newBatch.id);
    
    setNewBatchName('');
    setShowAddModal(false);
  };

  const handleDeleteBatch = (batchId) => {
    if (confirm('Are you sure you want to delete this flock batch tracker?')) {
      const updated = batches.filter(b => b.id !== batchId);
      setBatches(updated);
      if (selectedBatchId === batchId) {
        setSelectedBatchId(updated[0]?.id || '');
      }
    }
  };

  const toggleVaccineCompletion = (batchId, dayOffset) => {
    setBatches(prevBatches => {
      return prevBatches.map(batch => {
        if (batch.id === batchId) {
          const isCompleted = batch.completedVaccines.includes(dayOffset);
          let updatedCompleted;
          if (isCompleted) {
            updatedCompleted = batch.completedVaccines.filter(d => d !== dayOffset);
          } else {
            updatedCompleted = [...batch.completedVaccines, dayOffset];
          }
          return { ...batch, completedVaccines: updatedCompleted };
        }
        return batch;
      });
    });
  };

  const calculateDueDate = (hatchDateStr, dayOffset) => {
    const date = new Date(hatchDateStr);
    date.setDate(date.getDate() + (dayOffset - 1));
    return date;
  };

  const getVaccineStatus = (batch, dayOffset) => {
    const isCompleted = batch.completedVaccines.includes(dayOffset);
    if (isCompleted) return 'Completed';

    const dueDate = calculateDueDate(batch.hatchDate, dayOffset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due Today';
    if (diffDays < 0) return 'Overdue';
    return 'Upcoming';
  };

  const currentBatch = batches.find(b => b.id === selectedBatchId) || batches[0];

  const filteredSchedule = MASTER_VACCINATION_SCHEDULE.filter(v => {
    if (scheduleFilter === 'All') return true;
    if (scheduleFilter === 'Layers') return v.importance !== 'Broiler Only';
    if (scheduleFilter === 'Broilers') return v.dayOffset <= 42;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Immunization & Batch Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">Poultry Vaccination Portal</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Manage multi-batch immunization schedules, track due dates, and explore the complete master poultry vaccination protocol.
          </p>
        </div>

        {/* SECTION 1: MULTI-BATCH VACCINATION TRACKER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                <Syringe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <span>Multi-Batch Schedule Tracker</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select a flock batch to view auto-calculated calendar due dates & update immunization status.</p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Batch</span>
            </button>
          </div>

          {/* Batch Selector Pills */}
          {batches.length > 0 ? (
            <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-none">
              {batches.map((batch) => {
                const isSelected = batch.id === selectedBatchId;
                const completedCount = batch.completedVaccines.length;
                const totalCount = MASTER_VACCINATION_SCHEDULE.length;
                return (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border text-left whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-600/20 border-emerald-500 text-slate-900 dark:text-white shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{batch.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{batch.flockSize} Birds • {batch.flockType}</div>
                    </div>
                    <span className="bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700">
                      {completedCount}/{totalCount}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No active flock batches found. Click "Add New Batch" to start tracking.
            </div>
          )}

          {/* Active Batch Detail Panel */}
          {currentBatch && (
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{currentBatch.name}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Hatch Date: <strong className="text-slate-900 dark:text-slate-200">{currentBatch.hatchDate}</strong></span>
                    <span>•</span>
                    <span>Flock Size: <strong className="text-slate-900 dark:text-slate-200">{currentBatch.flockSize} Birds</strong></span>
                    <span>•</span>
                    <span>Type: <strong className="text-emerald-600 dark:text-emerald-400">{currentBatch.flockType}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBatch(currentBatch.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Batch</span>
                </button>
              </div>

              {/* Batch Vaccination Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MASTER_VACCINATION_SCHEDULE.map((vac) => {
                  const dueDate = calculateDueDate(currentBatch.hatchDate, vac.dayOffset);
                  const status = getVaccineStatus(currentBatch, vac.dayOffset);
                  const isDone = status === 'Completed';

                  return (
                    <div
                      key={vac.dayOffset}
                      className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between space-x-4 ${
                        isDone
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                          : status === 'Due Today'
                          ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/50 shadow-sm animate-pulse'
                          : status === 'Overdue'
                          ? 'bg-red-500/10 dark:bg-red-950/30 border-red-300 dark:border-red-800/50'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{vac.ageLabel}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            status === 'Completed' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                            status === 'Due Today' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40' :
                            status === 'Overdue' ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40' :
                            'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{vac.vaccineName}</h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Due Date: <strong>{dueDate.toDateString()}</strong></span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Route: {vac.route}</div>
                      </div>

                      <button
                        onClick={() => toggleVaccineCompletion(currentBatch.id, vac.dayOffset)}
                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                        title={isDone ? 'Mark as Pending' : 'Mark as Completed'}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* SECTION 2: MASTER POULTRY VACCINATION PROTOCOL TABLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Master Poultry Vaccination Protocol</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Standard immunization schedule guidelines recommended by avian health experts.</p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
              <Filter className="h-4 w-4 text-slate-400 ml-2" />
              {['All', 'Layers', 'Broilers'].map(type => (
                <button
                  key={type}
                  onClick={() => setScheduleFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleFilter === type
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Age / Timing</th>
                  <th className="py-3.5 px-4 font-semibold">Vaccine Name</th>
                  <th className="py-3.5 px-4 font-semibold">Target Disease</th>
                  <th className="py-3.5 px-4 font-semibold">Administration Route</th>
                  <th className="py-3.5 px-4 font-semibold">Importance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSchedule.map((vac) => (
                  <tr key={vac.dayOffset} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{vac.ageLabel}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{vac.vaccineName}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{vac.diseaseTarget}</td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">{vac.route}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        vac.importance === 'Critical'
                          ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {vac.importance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* ADD BATCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-fadeIn">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Poultry Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Batch Identifier / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batch #103 - Commercial Layers"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Flock Type</label>
                  <select
                    value={newFlockType}
                    onChange={(e) => setNewFlockType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Layers">Layers</option>
                    <option value="Broilers">Broilers</option>
                    <option value="Breeders">Breeders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Flock Size (Birds)</label>
                  <input
                    type="number"
                    min="1"
                    value={newFlockSize}
                    onChange={(e) => setNewFlockSize(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hatch / Arrival Date</label>
                <input
                  type="date"
                  required
                  value={newHatchDate}
                  onChange={(e) => setNewHatchDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg cursor-pointer"
                >
                  Create Tracker
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

import React from 'react';
import { useApp } from '../../context/AppContext';
import { OFFICIAL_NER_REGIONS, NERStateId } from '../../utils/nerData';
import { soundFx } from '../../utils/audio';
import { X, Check, MapPin } from 'lucide-react';

export const RegionSelectModal: React.FC = () => {
  const { isRegionModalOpen, setRegionModalOpen, selectedRegion, setSelectedRegion, t } = useApp();

  if (!isRegionModalOpen) return null;

  const handleSelect = (id: NERStateId) => {
    soundFx.playSuccessChime();
    setSelectedRegion(id);
    setRegionModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-white dark:bg-stone-900 border-3 border-stone-300 dark:border-stone-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-800 dark:bg-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-emerald-950 dark:border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                {t('selectYourRegion')}
              </h3>
              <p className="text-xs text-emerald-200 font-bold">
                {t('selectRegionDesc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setRegionModalOpen(false)}
            className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-900 flex items-center justify-center text-white border border-emerald-500 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Clean, Chunky Text-Only Grid (Zero Images / Emojis) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {OFFICIAL_NER_REGIONS.map((region) => {
              const isSelected = selectedRegion === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleSelect(region.id)}
                  className={`min-h-[64px] sm:min-h-[72px] rounded-2xl border-3 p-4 flex items-center justify-between text-left transition-all select-none cursor-pointer active:scale-98 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-b-6 border-b-emerald-800 dark:border-b-emerald-700 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-400 shadow-md'
                      : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 border-b-5 border-b-stone-400 dark:border-b-stone-950 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-stone-750 text-stone-900 dark:text-stone-100 shadow-xs'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-base sm:text-lg font-black block leading-tight truncate">
                      {region.name}
                    </span>
                    <span className="text-sm font-bold text-stone-500 dark:text-stone-400 block mt-0.5">
                      ({region.nativeScript})
                    </span>
                  </div>

                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl border-2 border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-500"></span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-t-2 border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
            Current: <strong className="text-emerald-800 dark:text-emerald-400 capitalize">{selectedRegion}</strong>
          </span>
          <button
            type="button"
            onClick={() => setRegionModalOpen(false)}
            className="duo-btn duo-btn-green py-2 px-6 text-sm font-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

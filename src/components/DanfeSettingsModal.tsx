import React from 'react';
import { X, Settings, Image as ImageIcon, Sliders, Layout, Type } from 'lucide-react';
import { DanfeCustomization } from '../types/nfe';

interface DanfeSettingsModalProps {
  customization: DanfeCustomization;
  onSave: (newSettings: DanfeCustomization) => void;
  onClose: () => void;
}

export const DanfeSettingsModal: React.FC<DanfeSettingsModalProps> = ({
  customization,
  onSave,
  onClose,
}) => {
  const [settings, setSettings] = React.useState<DanfeCustomization>(customization);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings((prev) => ({
          ...prev,
          customLogoUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Configurações do Layout DANFE PDF</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          {/* LOGO EMITENTE */}
          <div>
            <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span>Logotipo Personalizado do Emitente (Opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              {settings.customLogoUrl ? (
                <div className="relative border border-slate-300 rounded p-1 bg-slate-50 max-w-[120px]">
                  <img src={settings.customLogoUrl} alt="Logo" className="max-h-12 mx-auto object-contain" />
                  <button
                    onClick={() => setSettings((p) => ({ ...p, customLogoUrl: undefined }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Imagens PNG ou JPG com fundo transparente ou branco para o quadro do emitente.
            </p>
          </div>

          {/* CANHOTO SEFAZ */}
          <div>
            <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-slate-500" />
              <span>Canhoto de Recebimento de Mercadorias</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, showCanhoto: true, canhotoPosition: 'top' }))}
                className={`p-2 rounded-lg border text-center font-medium cursor-pointer ${
                  settings.showCanhoto && settings.canhotoPosition === 'top'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                No Topo (Padrão)
              </button>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, showCanhoto: true, canhotoPosition: 'bottom' }))}
                className={`p-2 rounded-lg border text-center font-medium cursor-pointer ${
                  settings.showCanhoto && settings.canhotoPosition === 'bottom'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                No Rodapé
              </button>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, showCanhoto: false }))}
                className={`p-2 rounded-lg border text-center font-medium cursor-pointer ${
                  !settings.showCanhoto
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                Ocultar Canhoto
              </button>
            </div>
          </div>

          {/* FONT SIZE */}
          <div>
            <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-slate-500" />
              <span>Tamanho da Fonte da DANFE</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, fontSize: 'xs' }))}
                className={`p-2 rounded-lg border text-center font-medium cursor-pointer ${
                  settings.fontSize === 'xs'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                Compacto (9px)
              </button>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, fontSize: 'sm' }))}
                className={`p-2 rounded-lg border text-center font-medium cursor-pointer ${
                  settings.fontSize === 'sm'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                Padrão SEFAZ (10px)
              </button>
              <button
                type="button"
                onClick={() => setSettings((p) => ({ ...p, fontSize: 'base' }))}
                className={`p-2 rounded-lg border text-center font-medium cursor-pointer ${
                  settings.fontSize === 'base'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                Ampliado (11px)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

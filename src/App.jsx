import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, Loader2, Info, Image as ImageIcon, 
  Layout, CheckCircle2, ChevronRight, Type, AlertCircle
} from 'lucide-react';

/**
 * RSP KUNSTVERLAG - EDITOR V3.3
 * Fokus: Text-Manipulation & Multi-Template Management
 */

const App = () => {
  const [project, setProject] = useState({ front: null, inside: null });
  const [shopContext, setShopContext] = useState({ 
    artNr: '', 
    frontId: '', 
    insideId: '', 
    session: '' 
  });
  
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'inside'
  const [selectedId, setSelectedId] = useState(null);
  const [showBleed, setShowBleed] = useState(true);
  
  // Konfiguration des neuen Bildservers
  const ASSET_SERVER = "https://bilderserver.rsp-kunstverlag.com"; 
  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  // Template-Lader
  const fetchTemplate = useCallback(async (templateId) => {
    try {
      const response = await fetch(`${N8N_API_URL}?artNr=${templateId}`);
      if (!response.ok) throw new Error("Netzwerk-Fehler");
      const data = await response.json();
      const result = Array.isArray(data) ? data[0] : data;
      return result.canvas_data.project;
    } catch (err) {
      console.error(`Fehler beim Laden von ${templateId}:`, err);
      return null;
    }
  }, []);

  // Handshake mit dem Shop (URL Parameter auslesen)
  useEffect(() => {
    const initFromShop = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const config = {
        artNr: urlParams.get('artNr') || '29009',
        frontId: urlParams.get('front') || 'wk_motiv',
        insideId: urlParams.get('inside') || 'wk_In_1',
        session: urlParams.get('session') || 'dev-session'
      };
      setShopContext(config);

      setLoading(true);
      const [frontProject, insideProject] = await Promise.all([
        fetchTemplate(config.frontId),
        fetchTemplate(config.insideId)
      ]);

      setProject({ front: frontProject, inside: insideProject });
      setLoading(false);
    };

    initFromShop();
  }, [fetchTemplate]);

  // Bildpfad-Logik (Variable auto_filename)
  const getImgSrc = (obj) => {
    if (obj.metadata?.['editor:dynamic-source'] === 'auto_filename') {
      return `${ASSET_SERVER}/fronts/${shopContext.artNr}.jpg`;
    }
    return `${ASSET_SERVER}/assets/${shopContext.artNr}/${obj.linkedFileName}`;
  };

  // Text-Update Funktion
  const handleTextUpdate = (id, text) => {
    setProject(prev => ({
      ...prev,
      [activeSide]: {
        ...prev[activeSide],
        objects: {
          ...prev[activeSide].objects,
          [id]: { ...prev[activeSide].objects[id], content: text }
        }
      }
    }));
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400">Layout-Engine wird initialisiert</p>
    </div>
  );

  const currentData = activeSide === 'front' ? project.front : project.inside;
  
  // Sicherheits-Check falls Template nicht geladen werden konnte
  if (!currentData) return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <p className="font-bold text-slate-800">Vorlage konnte nicht geladen werden.</p>
      <p className="text-sm text-slate-500 max-w-md mt-2">Bitte prüfen Sie, ob die Vorlagen-IDs korrekt in der Datenbank hinterlegt sind.</p>
    </div>
  );

  const currentPage = currentData.pages['page_0'];
  const objects = currentPage.objectsIds.map(id => currentData.objects[id]);
  const selectedElement = selectedId ? currentData.objects[selectedId] : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left">
      
      {/* Sidebar Navigation */}
      <nav className="w-24 bg-slate-900 flex flex-col items-center py-8 gap-10 shadow-2xl z-40">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white font-bold italic text-xl border border-white/10">RSP</div>
        
        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setActiveSide('front'); setSelectedId(null); }}
            className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'front' ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center ${activeSide === 'front' ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-slate-800 bg-slate-800/40'}`}>
              <ImageIcon size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Aussen</span>
          </button>

          <button 
            onClick={() => { setActiveSide('inside'); setSelectedId(null); }}
            className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'inside' ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center ${activeSide === 'inside' ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-slate-800 bg-slate-800/40'}`}>
              <Layout size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Innen</span>
          </button>
        </div>

        <div className="mt-auto">
          <button onClick={() => setShowBleed(!showBleed)} className={`p-4 rounded-2xl transition-all ${showBleed ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
            {showBleed ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-20 shadow-sm">
          <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-[0.3em] mb-1">Konfigurations-Modus</span>
              <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">Art. {shopContext.artNr} — {activeSide === 'front' ? 'Vorderseite' : 'Innenseite'}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-indigo-600 shadow-xl transition-all active:scale-95 group">
              <CheckCircle2 size={16} className="group-hover:text-white text-indigo-400" /> Gestaltung bestätigen
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-200/40 p-20 flex items-start justify-center custom-scrollbar">
          <div 
            className="bg-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.2)] relative transition-all duration-700 ease-in-out"
            style={{ 
                width: `${currentPage.width}px`, 
                height: `${currentPage.height}px`,
                transform: 'scale(1.1)',
                transformOrigin: 'top center'
            }}
          >
            {/* Bleed Guide */}
            {showBleed && (
              <div className="absolute inset-0 border-red-500/10 border-dashed pointer-events-none z-50 transition-opacity duration-300"
                style={{
                  borderTopWidth: `${currentPage.boxes.trimbox.top}px`,
                  borderRightWidth: `${currentPage.boxes.trimbox.right}px`,
                  borderBottomWidth: `${currentPage.boxes.trimbox.bottom}px`,
                  borderLeftWidth: `${currentPage.boxes.trimbox.left}px`,
                }}
              />
            )}

            {objects.map(obj => (
              <div
                key={obj.id}
                onClick={() => obj.layer !== 'unten' && setSelectedId(obj.id)}
                className={`absolute transition-all ${obj.layer !== 'unten' ? 'cursor-pointer group' : 'pointer-events-none'} ${selectedId === obj.id ? 'ring-2 ring-indigo-500 z-20 shadow-2xl' : ''}`}
                style={{
                  top: `${obj.top}px`, left: `${obj.left}px`,
                  width: `${obj.width}px`, height: `${obj.height}px`,
                  overflow: 'hidden'
                }}
              >
                {obj.type === 'image' ? (
                  <div className="w-full h-full bg-slate-50 relative">
                      <img 
                        src={getImgSrc(obj)} 
                        className="w-full h-full object-cover opacity-100 transition-opacity" 
                        alt="" 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div className="absolute inset-0 hidden flex-col items-center justify-center text-slate-300 bg-slate-50 gap-2 border border-dashed border-slate-200">
                          <ImageIcon size={24} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">{obj.linkedFileName}</span>
                      </div>
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: `${obj.fontSize}px`, 
                    fontFamily: obj.fontFamily || 'sans-serif', 
                    color: '#1e293b', 
                    lineHeight: 1.2, 
                    whiteSpace: 'pre-wrap',
                    padding: '1px'
                  }}>
                    {obj.content}
                  </div>
                )}
                {obj.layer !== 'unten' && selectedId !== obj.id && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-indigo-500 text-white p-1 rounded shadow-lg">
                            {obj.type === 'text' ? <Type size={10} /> : <ImageIcon size={10} />}
                        </div>
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Inspector Sidebar */}
      <aside className="w-85 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40">
        <div className="p-8 border-b border-slate-100 bg-slate-50/40">
            <h2 className="font-bold uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-2">
                <Settings2 size={12} className="text-indigo-500" /> Inspektor
            </h2>
            
            {selectedElement && selectedElement.type === 'text' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-300">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inhalt bearbeiten</label>
                            <span className="text-[9px] font-mono text-slate-300">{selectedElement.id}</span>
                        </div>
                        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 transition-colors">
                            <textarea 
                                className="w-full text-sm outline-none border-none p-0 bg-transparent resize-none h-48 text-slate-700 leading-relaxed font-sans"
                                value={selectedElement.content}
                                onChange={(e) => handleTextUpdate(selectedId, e.target.value)}
                                placeholder="Geben Sie hier Ihren Text ein..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
                        <div className="flex items-center gap-2">
                            <Info size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Ebene: {selectedElement.layer}</span>
                        </div>
                        {selectedElement.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </div>
                </div>
            ) : (
                <div className="py-28 flex flex-col items-center text-center opacity-30 gap-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <Type size={24} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-12 leading-relaxed text-slate-500">
                        Klicken Sie ein Textfeld auf der Karte an, um es zu bearbeiten.
                    </p>
                </div>
            )}
        </div>

        <div className="p-8 mt-auto border-t border-slate-100">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                    <CheckCircle2 size={18} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-700 tracking-tight">Format verifiziert</p>
                    <p className="text-[9px] text-slate-400 font-medium">Layout entspricht Master</p>
                </div>
            </div>
        </div>
      </aside>
    </div>
  );
};

export default App;

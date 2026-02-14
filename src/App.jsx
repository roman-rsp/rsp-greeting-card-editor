import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, Loader2, Info, Image as ImageIcon, 
  Layout, CheckCircle2, ChevronRight, Type, AlertCircle
} from 'lucide-react';

/**
 * STATISCHE TESTDATEN (MOCK DATA)
 * Basierend auf deinen InDesign-Exporten Motiv_data.json und wk_innen_1_data.json
 */
const MOCK_DATA = {
  "wk_motiv": {
    "project": {
      "name": "Motiv.indd",
      "pages": {
        "page_0": {
          "id": "page_0", "width": 595.27, "height": 595.27,
          "objectsIds": ["Block_296", "Block_302", "Block_293"],
          "boxes": { "trimbox": { "top": 8.5, "right": 8.5, "bottom": 8.5, "left": 8.5 } }
        }
      },
      "objects": {
        "Block_296": {
          "id": "Block_296", "type": "image", "top": -8.48, "left": -8.48, "width": 612.24, "height": 612.24,
          "layer": "bearbeitung", "metadata": { "editor:dynamic-source": "auto_filename" }, "isLocked": true
        },
        "Block_302": {
          "id": "Block_302", "type": "text", "top": 50, "left": 50, "width": 200, "height": 40,
          "layer": "bearbeitung", "content": "Frohes Fest", "fontSize": 24, "fontFamily": "Poppins"
        },
        "Block_293": {
          "id": "Block_293", "type": "text", "top": 570, "left": 0, "width": 595, "height": 20,
          "layer": "unten", "content": "www.rsp-kunstverlag.com", "fontSize": 7, "fontFamily": "Poppins Light"
        }
      }
    }
  },
  "wk_In_1": {
    "project": {
      "name": "wk_innen_1.indd",
      "pages": {
        "page_0": {
          "id": "page_0", "width": 595.27, "height": 595.27,
          "objectsIds": ["Block_451", "Block_322"],
          "boxes": { "trimbox": { "top": 8.5, "right": 8.5, "bottom": 8.5, "left": 8.5 } }
        }
      },
      "objects": {
        "Block_451": {
          "id": "Block_451", "type": "text", "top": 100, "left": 50, "width": 500, "height": 100,
          "layer": "bearbeitung", "content": "Hier steht Ihr individueller Text für die Innenseite.\nZweite Zeile für den Test.",
          "fontSize": 12, "fontFamily": "Poppins Light"
        },
        "Block_322": {
          "id": "Block_322", "type": "image", "top": 450, "left": 450, "width": 100, "height": 100,
          "layer": "bearbeitung", "linkedFileName": "logo.png"
        }
      }
    }
  }
};

const App = () => {
  const [project, setProject] = useState({ front: null, inside: null });
  const [shopContext, setShopContext] = useState({ 
    artNr: '29009', 
    frontId: 'wk_motiv', 
    insideId: 'wk_In_1', 
    session: 'dev-session' 
  });
  
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState('front'); 
  const [selectedId, setSelectedId] = useState(null);
  const [showBleed, setShowBleed] = useState(true);
  
  const ASSET_SERVER = "https://bilderserver.rsp-kunstverlag.com"; 
  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  const fetchTemplate = useCallback(async (templateId) => {
    try {
      // Versuch, echte Daten zu laden
      const response = await fetch(`${N8N_API_URL}?artNr=${templateId}`);
      if (!response.ok) throw new Error("API nicht erreichbar");
      const data = await response.json();
      const result = Array.isArray(data) ? data[0] : data;
      return result.canvas_data.project;
    } catch (err) {
      console.warn(`Nutze statisches Backup für: ${templateId}`);
      // Fallback auf unsere MOCK_DATA
      return MOCK_DATA[templateId]?.project || null;
    }
  }, []);

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

  const getImgSrc = (obj) => {
    if (obj.metadata?.['editor:dynamic-source'] === 'auto_filename') {
      return `${ASSET_SERVER}/fronts/${shopContext.artNr}.jpg`;
    }
    return `${ASSET_SERVER}/assets/${shopContext.artNr}/${obj.linkedFileName}`;
  };

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
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400">Layout-Engine wird initialisiert (Statik-Modus aktiv)</p>
    </div>
  );

  const currentData = activeSide === 'front' ? project.front : project.inside;
  if (!currentData) return <div className="p-20">Fehler beim Laden der Vorlage.</div>;

  const currentPage = currentData.pages['page_0'];
  const objects = currentPage.objectsIds.map(id => currentData.objects[id]);
  const selectedElement = selectedId ? currentData.objects[selectedId] : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left">
      <nav className="w-24 bg-slate-900 flex flex-col items-center py-8 gap-10 shadow-2xl z-40">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white font-bold italic text-xl border border-white/10">RSP</div>
        <div className="flex flex-col gap-8">
          <button onClick={() => { setActiveSide('front'); setSelectedId(null); }} className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'front' ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center ${activeSide === 'front' ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-slate-800 bg-slate-800/40'}`}><ImageIcon size={20} /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Aussen</span>
          </button>
          <button onClick={() => { setActiveSide('inside'); setSelectedId(null); }} className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'inside' ? 'text-white scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center ${activeSide === 'inside' ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-slate-800 bg-slate-800/40'}`}><Layout size={20} /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Innen</span>
          </button>
        </div>
        <div className="mt-auto">
          <button onClick={() => setShowBleed(!showBleed)} className={`p-4 rounded-2xl transition-all ${showBleed ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}><Eye size={20} /></button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-20 shadow-sm">
          <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-[0.3em] mb-1 italic">Entwicklungs-Modus (Statisch)</span>
              <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">Art. {shopContext.artNr} — {activeSide === 'front' ? 'Vorderseite' : 'Innenseite'}</span>
          </div>
          <button className="flex items-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-indigo-600 shadow-xl transition-all active:scale-95 group">
            <CheckCircle2 size={16} className="text-indigo-400" /> Gestaltung bestätigen
          </button>
        </header>

        <div className="flex-1 overflow-auto bg-slate-200/40 p-20 flex items-start justify-center custom-scrollbar">
          <div className="bg-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.2)] relative transition-all duration-700 ease-in-out"
            style={{ width: `${currentPage.width}px`, height: `${currentPage.height}px`, transform: 'scale(1.1)', transformOrigin: 'top center' }}
          >
            {showBleed && (
              <div className="absolute inset-0 border-red-500/10 border-dashed pointer-events-none z-50"
                style={{ borderTopWidth: `${currentPage.boxes.trimbox.top}px`, borderRightWidth: `${currentPage.boxes.trimbox.right}px`, borderBottomWidth: `${currentPage.boxes.trimbox.bottom}px`, borderLeftWidth: `${currentPage.boxes.trimbox.left}px` }}
              />
            )}

            {objects.map(obj => (
              <div key={obj.id} onClick={() => obj.layer !== 'unten' && setSelectedId(obj.id)}
                className={`absolute transition-all ${obj.layer !== 'unten' ? 'cursor-pointer group' : 'pointer-events-none'} ${selectedId === obj.id ? 'ring-2 ring-indigo-500 z-20 shadow-2xl' : ''}`}
                style={{ top: `${obj.top}px`, left: `${obj.left}px`, width: `${obj.width}px`, height: `${obj.height}px`, overflow: 'hidden' }}
              >
                {obj.type === 'image' ? (
                  <div className="w-full h-full bg-slate-50 relative">
                      <img src={getImgSrc(obj)} className="w-full h-full object-cover" alt="" 
                           onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      <div className="absolute inset-0 hidden flex-col items-center justify-center text-slate-300 bg-slate-50 gap-2 border border-dashed border-slate-200">
                          <ImageIcon size={24} /><span className="text-[8px] font-bold uppercase tracking-widest">{obj.linkedFileName}</span>
                      </div>
                  </div>
                ) : (
                  <div style={{ fontSize: `${obj.fontSize}px`, fontFamily: obj.fontFamily || 'sans-serif', color: '#1e293b', lineHeight: 1.2, whiteSpace: 'pre-wrap', padding: '1px' }}>
                    {obj.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside className="w-85 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40">
        <div className="p-8 border-b border-slate-100 bg-slate-50/40">
            <h2 className="font-bold uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-2"><Settings2 size={12} className="text-indigo-500" /> Inspektor</h2>
            {selectedElement && selectedElement.type === 'text' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-5 duration-300">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block px-1">Inhalt bearbeiten</label>
                        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 transition-colors">
                            <textarea className="w-full text-sm outline-none border-none p-0 bg-transparent resize-none h-48 text-slate-700 leading-relaxed font-sans"
                                value={selectedElement.content} onChange={(e) => handleTextUpdate(selectedId, e.target.value)} placeholder="Text hier eingeben..." />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
                        <div className="flex items-center gap-2"><Info size={14} /><span className="text-[10px] font-bold uppercase tracking-tight">Ebene: {selectedElement.layer}</span></div>
                        {selectedElement.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </div>
                </div>
            ) : (
                <div className="py-28 flex flex-col items-center text-center opacity-30 gap-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Type size={24} /></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-12 text-slate-500">Klicken Sie ein Textfeld an, um es zu bearbeiten.</p>
                </div>
            )}
        </div>
      </aside>
    </div>
  );
};

export default App;

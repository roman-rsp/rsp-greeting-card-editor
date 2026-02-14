import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, Loader2, Info, Image as ImageIcon, 
  Layout, CheckCircle2, ChevronRight, Type, AlertCircle,
  Database, HardDrive
} from 'lucide-react';

/**
 * STATISCHE TESTDATEN (MOCK DATA)
 * Jetzt inklusive "textAlign" Info, genau wie sie aus dem JSON kommen sollte.
 */
const MOCK_DATA = {
  "wk_motiv": {
    "project": {
      "name": "Motiv.indd",
      "pages": {
        "page_0": {
          "id": "page_0", "width": 595.27, "height": 595.27,
          "objectsIds": ["Block_296_p0", "Block_302_p0", "Block_293_p0"],
          "boxes": { "trimbox": { "top": 8.5, "right": 8.5, "bottom": 8.5, "left": 8.5 } }
        }
      },
      "objects": {
        "Block_296_p0": {
          "id": "Block_296_p0", "type": "image", "top": -8.48, "left": -8.48, "width": 612.24, "height": 612.24,
          "layer": "unten", "metadata": { "editor:dynamic-source": "auto_filename" }, "isLocked": true, "zIndex": 1
        },
        "Block_302_p0": {
          "id": "Block_302_p0", "type": "text", "top": 150, "left": 50, "width": 495, "height": 60,
          "layer": "bearbeitung", "content": "Frohes Fest", "fontSize": 32, "fontFamily": "Poppins", "textAlign": "center", "zIndex": 50
        },
        "Block_293_p0": {
          "id": "Block_293_p0", "type": "text", "top": 570, "left": 0, "width": 595, "height": 20,
          "layer": "unten", "content": "www.rsp-kunstverlag.com", "fontSize": 7, "fontFamily": "Poppins Light", "textAlign": "center", "zIndex": 5
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
          "objectsIds": ["Block_Zitat", "Block_Greeting", "Block_Signature", "Block_Address", "Block_Logo"],
          "boxes": { "trimbox": { "top": 8.5, "right": 8.5, "bottom": 8.5, "left": 8.5 } }
        }
      },
      "objects": {
        "Block_Zitat": {
          "id": "Block_Zitat", "type": "text", "top": 80, "left": 60, "width": 475, "height": 100,
          "layer": "bearbeitung", "content": "Immer jünger werden, je älter man wird,\ndas ist die rechte Lebenskunst.\n- Ernst Thälmann -",
          "fontSize": 14, "fontFamily": "Poppins Light", "textAlign": "center", "zIndex": 50
        },
        "Block_Greeting": {
          "id": "Block_Greeting", "type": "text", "top": 200, "left": 60, "width": 475, "height": 80,
          "layer": "bearbeitung", "content": "Herzlichen Glückwunsch zum Geburtstag.\nVor allem Gesundheit, Glück und Erfolg.",
          "fontSize": 16, "fontFamily": "Poppins", "textAlign": "center", "zIndex": 50
        },
        "Block_Signature": {
          "id": "Block_Signature", "type": "text", "top": 320, "left": 60, "width": 475, "height": 80,
          "layer": "bearbeitung", "content": "Wünscht Ihnen\nMax Mustermann und das gesamte Team",
          "fontSize": 14, "fontFamily": "Poppins Light", "textAlign": "center", "zIndex": 50
        },
        "Block_Address": {
          "id": "Block_Address", "type": "text", "top": 520, "left": 60, "width": 475, "height": 40,
          "layer": "unten", "content": "Muster GmbH Erfolgstrasse 11 24258 Glückhausen\ninfo@mustergmbh.com",
          "fontSize": 9, "fontFamily": "Poppins Light", "textAlign": "center", "zIndex": 10
        },
        "Block_Logo": {
          "id": "Block_Logo", "type": "image", "top": 420, "left": 237, "width": 120, "height": 60,
          "layer": "bearbeitung", "linkedFileName": "logo.png", "zIndex": 10
        }
      }
    }
  }
};

const App = () => {
  const [project, setProject] = useState({ front: null, inside: null });
  const [shopContext, setShopContext] = useState({ 
    artNr: '29009', frontId: 'wk_motiv', insideId: 'wk_In_1', session: 'dev-session' 
  });
  
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState('front'); 
  const [selectedId, setSelectedId] = useState(null);
  const [showBleed, setShowBleed] = useState(true);
  const [dataSource, setDataSource] = useState('initializing');
  
  const ASSET_SERVER = "https://bilderserver.rsp-kunstverlag.com"; 
  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  const sanitizeFont = (fontName) => {
    if (!fontName) return 'sans-serif';
    return fontName.replace(/\t/g, ' ');
  };

  const resolveObject = (projectData, id) => {
    if (!projectData || !projectData.objects) return null;
    if (projectData.objects[id]) return projectData.objects[id];
    const baseId = id.split('_p')[0];
    if (projectData.objects[baseId]) return projectData.objects[baseId];
    return null;
  };

  const fetchTemplate = useCallback(async (templateId) => {
    try {
      const response = await fetch(`${N8N_API_URL}?artNr=${templateId}`);
      if (!response.ok) throw new Error("API Offline");
      const data = await response.json();
      const result = Array.isArray(data) ? data[0] : data;
      setDataSource('live');
      return result.canvas_data.project;
    } catch (err) {
      setDataSource('backup');
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
    const side = activeSide;
    setProject(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        objects: {
          ...prev[side].objects,
          [id]: { ...prev[side].objects[id], content: text }
        }
      }
    }));
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-sans">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400">Synchronisiere Master-Daten...</p>
    </div>
  );

  const currentProject = activeSide === 'front' ? project.front : project.inside;
  if (!currentProject) return <div className="p-20 font-sans text-center">Fehler: Vorlage nicht gefunden.</div>;

  const pageKey = (activeSide === 'inside' && currentProject.pages['page_1']) ? 'page_1' : 'page_0';
  const currentPage = currentProject.pages[pageKey];
  
  const objects = currentPage.objectsIds
    .map(id => resolveObject(currentProject, id))
    .filter(obj => !!obj);

  const selectedElement = selectedId ? currentProject.objects[selectedId] : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left text-[14px]">
      
      {/* Sidebar-Navigation */}
      <nav className="w-24 bg-slate-900 flex flex-col items-center py-8 gap-10 shadow-2xl z-[100]">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold italic text-xl shadow-lg border border-indigo-500/20">RSP</div>
        <div className="flex flex-col gap-8 text-center items-center">
          <button onClick={() => { setActiveSide('front'); setSelectedId(null); }} className={`flex flex-col items-center gap-2 transition-all w-full px-2 ${activeSide === 'front' ? 'text-white scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center transition-all ${activeSide === 'front' ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-800 bg-slate-800/40'}`}><ImageIcon size={20} /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-center">Aussen</span>
          </button>
          <button onClick={() => { setActiveSide('inside'); setSelectedId(null); }} className={`flex flex-col items-center gap-2 transition-all w-full px-2 ${activeSide === 'inside' ? 'text-white scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center transition-all ${activeSide === 'inside' ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-800 bg-slate-800/40'}`}><Layout size={20} /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-center">Innen</span>
          </button>
        </div>
        <div className="mt-auto">
          <button onClick={() => setShowBleed(!showBleed)} title="Anschnitt anzeigen" className={`p-4 rounded-2xl transition-all ${showBleed ? 'text-indigo-400 bg-indigo-400/10 shadow-inner shadow-indigo-500/20' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}><Eye size={20} /></button>
        </div>
      </nav>

      {/* Hauptarbeitsbereich */}
      <main className="flex-1 flex flex-col relative overflow-hidden text-left">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-20 shadow-sm">
          <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-[0.3em] mb-1 italic">Vorschau-Modus</span>
              <span className="text-sm font-bold text-slate-800 tracking-tight uppercase tracking-widest">Art. {shopContext.artNr} — {activeSide === 'front' ? 'Vorderseite' : 'Innenseite'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${dataSource === 'live' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
              {dataSource === 'live' ? <Database size={10} /> : <HardDrive size={10} />}
              {dataSource === 'live' ? 'Live JSON' : 'Backup Modus'}
            </div>
            <button className="flex items-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-indigo-600 shadow-xl transition-all active:scale-95 group border border-slate-700">
              <CheckCircle2 size={16} className="text-indigo-400 group-hover:text-white transition-colors" /> Gestaltung bestätigen
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-200/40 p-20 flex items-start justify-center custom-scrollbar">
          <div className="bg-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.15)] relative transition-all duration-700 ease-in-out"
            style={{ width: `${currentPage.width}px`, height: `${currentPage.height}px`, transform: 'scale(1.1)', transformOrigin: 'top center' }}
          >
            {showBleed && (
              <div className="absolute inset-0 border-red-500/10 border-dashed pointer-events-none z-[1000]"
                style={{ borderTopWidth: `${currentPage.boxes.trimbox.top}px`, borderRightWidth: `${currentPage.boxes.trimbox.right}px`, borderBottomWidth: `${currentPage.boxes.trimbox.bottom}px`, borderLeftWidth: `${currentPage.boxes.trimbox.left}px` }}
              />
            )}

            {objects.map(obj => (
              <div key={obj.id} onClick={() => obj.layer !== 'unten' && setSelectedId(obj.id)}
                className={`absolute transition-all flex ${obj.layer !== 'unten' ? 'cursor-pointer group' : 'pointer-events-none'} ${selectedId === obj.id ? 'ring-2 ring-indigo-500 z-[60] shadow-2xl bg-indigo-500/5' : ''}`}
                style={{ 
                  top: `${obj.top}px`, left: `${obj.left}px`, width: `${obj.width}px`, height: `${obj.height}px`, overflow: 'hidden',
                  zIndex: obj.type === 'text' ? 500 : (obj.zIndex || 10),
                  // Dynamische Ausrichtung basierend auf JSON-Daten
                  alignItems: 'center', 
                  justifyContent: obj.textAlign === 'center' ? 'center' : (obj.textAlign === 'right' ? 'flex-end' : 'flex-start')
                }}
              >
                {obj.type === 'image' ? (
                  <div className="w-full h-full bg-slate-50 relative pointer-events-none">
                      <img src={getImgSrc(obj)} className="w-full h-full object-cover" alt="" 
                           onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      <div className="absolute inset-0 hidden flex-col items-center justify-center text-slate-300 bg-slate-100 gap-2 border border-dashed border-slate-200 text-center">
                          <ImageIcon size={24} /><span className="text-[8px] font-bold uppercase tracking-widest text-center">{obj.linkedFileName}</span>
                      </div>
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: `${obj.fontSize || 12}px`, 
                    fontFamily: sanitizeFont(obj.fontFamily), 
                    color: '#1e293b', 
                    lineHeight: 1.4, 
                    whiteSpace: 'pre-wrap', 
                    padding: '10px', 
                    width: '100%', 
                    // Hier greift die dynamische Text-Ausrichtung aus dem JSON
                    textAlign: obj.textAlign || 'left'
                  }}>
                    {obj.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Inspektor-Sidebar */}
      <aside className="w-85 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40 text-left">
        <div className="p-8 border-b border-slate-100 bg-slate-50/40 flex-1 overflow-y-auto custom-scrollbar text-left font-sans">
            <h2 className="font-bold uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-2 text-left">
                <Settings2 size={12} className="text-indigo-500" /> Werkzeuge
            </h2>
            
            {selectedElement && selectedElement.type === 'text' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 text-left">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 transition-all text-left">
                        <textarea 
                            className="w-full text-sm outline-none border-none p-0 bg-transparent resize-none h-48 text-slate-700 leading-relaxed font-sans text-left"
                            value={selectedElement.content || ''} 
                            onChange={(e) => handleTextUpdate(selectedId, e.target.value)} 
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl border border-slate-200 text-slate-500 opacity-60 text-left">
                        <div className="flex items-center gap-2 text-left"><Info size={14} /><span className="text-[10px] font-bold uppercase tracking-tight text-left">Info: {selectedElement.layer}</span></div>
                        {selectedElement.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </div>
                </div>
            ) : (
                <div className="py-28 flex flex-col items-center text-center opacity-30 gap-6 font-sans">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Type size={24} /></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-12 text-slate-500 leading-relaxed italic text-center">
                        Klicke einen Text auf der Karte an, um ihn zu bearbeiten.
                    </p>
                </div>
            )}
        </div>
      </aside>
    </div>
  );
};

export default App;

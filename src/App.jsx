import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, Loader2, Info, Image as ImageIcon, 
  Layout, CheckCircle2, ChevronRight, Type, AlertCircle,
  Database, HardDrive, RefreshCw
} from 'lucide-react';

/**
 * ECHTDATEN-CHECK (MOCK DATA)
 * Hier habe ich Deine hochgeladene 'wk_innen_1_data.json' eins zu eins eingesetzt.
 * Man sieht jetzt: Der Editor nutzt nur noch das, was im JSON steht.
 */
const MOCK_DATA = {
  "wk_motiv": {
    "project": {
      "name": "Motiv.indd",
      "pages": {
        "page_0": {
          "id": "page_0", "width": 595.27, "height": 595.27,
          "objectsIds": ["Block_296_p0", "Block_302_p0", "Block_352_p0"]
        }
      },
      "objects": {
        "Block_296_p0": { "id": "Block_296_p0", "type": "image", "top": -8.48, "left": -8.48, "width": 612.24, "height": 612.24, "layer": "unten", "metadata": { "editor:dynamic-source": "auto_filename" }, "zIndex": 1 },
        "Block_302_p0": { "id": "Block_302_p0", "type": "text", "top": 150, "left": 50, "width": 495, "height": 60, "layer": "bearbeitung", "content": "Frohes Fest", "fontSize": 32, "fontFamily": "Poppins", "textAlign": "center", "zIndex": 50 },
        "Block_352_p0": { "id": "Block_352_p0", "type": "text", "top": 570, "left": 0, "width": 595, "height": 20, "layer": "unten", "content": "www.rsp-kunstverlag.com", "fontSize": 7, "fontFamily": "Poppins Light", "textAlign": "center", "zIndex": 5 }
      }
    }
  },
  "wk_In_1": {
    "project": {
      "name": "wk_innen_1.indd",
      "pages": {
        "page_0": {
          "id": "page_0", "width": 595.27, "height": 595.27,
          "objectsIds": ["Block_448_p0", "Block_376_p0", "Block_424_p0", "Block_352_p0", "Block_451_p0"]
        }
      },
      "objects": {
        "Block_448_p0": {
          "id": "Block_448_p0", "type": "text", "top": 113.38, "left": 121.47, "width": 351.08, "height": 81.3,
          "content": "Immer jünger werden, je älter man wird,\ndas ist die rechte Lebenskunst.\n- Ernst Thälmann -",
          "fontSize": 14, "fontFamily": "Poppins Light", "textAlign": "center", "layer": "bearbeitung", "zIndex": 50
        },
        "Block_376_p0": {
          "id": "Block_376_p0", "type": "text", "top": 365.35, "left": 126.99, "width": 341.29, "height": 68.35,
          "content": "Herzlichen Glückwunsch zum Geburtstag.\nVor allem Gesundheit,\nGlück und Erfolg.",
          "fontSize": 15, "fontFamily": "Poppins Light Italic", "textAlign": "center", "layer": "bearbeitung", "zIndex": 50
        },
        "Block_424_p0": {
          "id": "Block_424_p0", "type": "text", "top": 453.54, "left": 121.47, "width": 351.08, "height": 81.3,
          "content": "Wünscht Ihnen\nMax Mustermann und das gesamte Team",
          "fontSize": 24, "fontFamily": "Dr Sugiyama Regular", "textAlign": "center", "layer": "bearbeitung", "zIndex": 50
        },
        "Block_352_p0": {
          "id": "Block_352_p0", "type": "text", "top": 567.63, "left": 126.99, "width": 341.29, "height": 18.06,
          "content": "Muster GmbH Erfolgstrasse 11 24258 Glückhausen info@mustergmbh.com",
          "fontSize": 7, "fontFamily": "Poppins Light", "textAlign": "center", "layer": "unten", "zIndex": 10
        },
        "Block_451_p0": {
          "id": "Block_451_p0", "type": "image", "top": 26.92, "left": 21.25, "width": 25, "height": 25,
          "linkedFileName": "logo.png", "layer": "bearbeitung", "zIndex": 20
        }
      }
    }
  }
};

const App = () => {
  const [project, setProject] = useState({ front: null, inside: null });
  const [shopContext, setShopContext] = useState({ artNr: '29009', frontId: 'wk_motiv', insideId: 'wk_In_1' });
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState('front'); 
  const [selectedId, setSelectedId] = useState(null);
  const [showBleed, setShowBleed] = useState(true);
  const [dataSource, setDataSource] = useState('backup');

  const ASSET_SERVER = "https://bilderserver.rsp-kunstverlag.com"; 
  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  const fetchTemplate = useCallback(async (templateId) => {
    try {
      const response = await fetch(`${N8N_API_URL}?artNr=${templateId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setDataSource('live');
      return (Array.isArray(data) ? data[0] : data).canvas_data.project;
    } catch (err) {
      return MOCK_DATA[templateId]?.project || null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [f, i] = await Promise.all([fetchTemplate(shopContext.frontId), fetchTemplate(shopContext.insideId)]);
      setProject({ front: f, inside: i });
      setLoading(false);
    };
    init();
  }, [fetchTemplate, shopContext.frontId, shopContext.insideId]);

  const handleTextUpdate = (id, text) => {
    const side = activeSide;
    setProject(prev => ({
      ...prev, [side]: { ...prev[side], objects: { ...prev[side].objects, [id]: { ...prev[side].objects[id], content: text } } }
    }));
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center font-sans text-slate-400 uppercase tracking-widest text-[10px]">Lade Layout-Architektur...</div>;

  const currentProject = activeSide === 'front' ? project.front : project.inside;
  const pageKey = (activeSide === 'inside' && currentProject.pages['page_1']) ? 'page_1' : 'page_0';
  const currentPage = currentProject.pages[pageKey];
  const objects = currentPage.objectsIds.map(id => currentProject.objects[id]).filter(Boolean);
  const selectedElement = selectedId ? currentProject.objects[selectedId] : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left text-[14px]">
      
      {/* Sidebar Navigation */}
      <nav className="w-24 bg-slate-900 flex flex-col items-center py-8 gap-10 shadow-2xl z-[100]">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold italic text-xl">RSP</div>
        <div className="flex flex-col gap-8 items-center w-full">
          <button onClick={() => { setActiveSide('front'); setSelectedId(null); }} className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'front' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center ${activeSide === 'front' ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20' : 'border-slate-800'}`}><ImageIcon size={20} /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Aussen</span>
          </button>
          <button onClick={() => { setActiveSide('inside'); setSelectedId(null); }} className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'inside' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <div className={`w-14 h-20 rounded-xl border-2 flex items-center justify-center ${activeSide === 'inside' ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20' : 'border-slate-800'}`}><Layout size={20} /></div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Innen</span>
          </button>
        </div>
        <div className="mt-auto">
          <button onClick={() => setShowBleed(!showBleed)} className={`p-4 rounded-2xl transition-all ${showBleed ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}><Eye size={20} /></button>
        </div>
      </nav>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-20 shadow-sm">
          <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-[0.3em] mb-1 italic">RSP Editor v3.8.0</span>
              <span className="text-sm font-bold text-slate-800 tracking-tight uppercase tracking-widest">Art. {shopContext.artNr} — {activeSide === 'front' ? 'Vorderseite' : 'Innenseite'}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${dataSource === 'live' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
             {dataSource === 'live' ? <Database size={10} /> : <HardDrive size={10} />} {dataSource === 'live' ? 'Datenbank' : 'Lokales JSON'}
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
                className={`absolute flex flex-col transition-all ${obj.layer !== 'unten' ? 'cursor-pointer group' : 'pointer-events-none'} ${selectedId === obj.id ? 'ring-2 ring-indigo-500 z-[60] shadow-2xl bg-indigo-500/5' : ''}`}
                style={{ 
                  top: `${obj.top}px`, left: `${obj.left}px`, width: `${obj.width}px`, height: `${obj.height}px`, overflow: 'hidden',
                  zIndex: obj.type === 'text' ? 500 : (obj.zIndex || 10),
                  justifyContent: 'center', // Vertikale Zentrierung
                  alignItems: obj.textAlign === 'center' ? 'center' : (obj.textAlign === 'right' ? 'flex-end' : 'flex-start')
                }}
              >
                {obj.type === 'image' ? (
                  <img src={`${ASSET_SERVER}/fronts/${shopContext.artNr}.jpg`} className="w-full h-full object-cover" alt="" 
                       onError={(e) => { e.target.style.background = '#f1f5f9'; e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'; }} />
                ) : (
                  <div style={{ 
                    fontSize: `${obj.fontSize || 12}px`, fontFamily: obj.fontFamily || 'sans-serif', color: '#1e293b', 
                    lineHeight: 1.4, whiteSpace: 'pre-wrap', padding: '0 10px', width: '100%',
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

      {/* Inspector Sidebar */}
      <aside className="w-85 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40 text-left">
        <div className="p-8 border-b border-slate-100 bg-slate-50/40 flex-1 overflow-y-auto text-left">
            <h2 className="font-bold uppercase text-[10px] tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-2"><Settings2 size={12} className="text-indigo-500" /> Gestaltung</h2>
            {selectedElement && selectedElement.type === 'text' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 transition-all text-left">
                        <textarea 
                            className="w-full text-sm outline-none border-none p-0 bg-transparent resize-none h-48 text-slate-700 leading-relaxed font-sans text-left"
                            value={selectedElement.content || ''} 
                            onChange={(e) => handleTextUpdate(selectedId, e.target.value)} 
                        />
                    </div>
                    <div className="p-4 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Ausrichtung: {selectedElement.textAlign || 'left'}</span>
                        {selectedElement.textAlign === 'center' ? <Type size={12} /> : null}
                    </div>
                </div>
            ) : (
                <div className="py-28 flex flex-col items-center text-center opacity-30 gap-6 font-sans">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Type size={24} /></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-12 text-slate-500 leading-relaxed italic text-center">Wähle ein Element zum Bearbeiten</p>
                </div>
            )}
        </div>
      </aside>
    </div>
  );
};

export default App;

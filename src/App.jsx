import React, { useState, useEffect } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, ChevronLeft, Loader2, AlertCircle, Info
} from 'lucide-react';

/**
 * MOCK_PROJECT: Statische Fallback-Daten mit Image-Beispiel
 * Wird genutzt, wenn n8n nicht erreichbar ist.
 */
const MOCK_PROJECT = {
  name: "Karte 29009 (Vorschau-Modus)",
  pages: {
    page_0: {
      id: "page_0",
      width: 612.28,
      height: 306.14,
      objectsIds: ["Text_Vorne", "Bild_Klee"],
      boxes: { trimbox: { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 } }
    }
  },
  objects: {
    "Text_Vorne": {
      id: "Text_Vorne",
      type: "text",
      top: 100,
      left: 350,
      width: 200,
      height: 50,
      content: "Herzliche Grüße\n(Mock-Daten)",
      fontSize: 18,
      fontFamily: "Arial",
      isLocked: true,
      layer: "bearbeitung"
    },
    "Bild_Klee": {
      id: "Bild_Klee",
      type: "image",
      top: 50,
      left: 50,
      width: 150,
      height: 150,
      linkedFileName: "25002.png",
      contentTransform: {
        topOffset: -10,
        leftOffset: -10,
        contentWidth: 170,
        contentHeight: 170
      },
      isLocked: true,
      layer: "bearbeitung"
    }
  }
};

const App = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showBleed, setShowBleed] = useState(true);
  const [status, setStatus] = useState('loading'); // 'live' oder 'local'
  const [artNr, setArtNr] = useState('29009');

  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      const currentArtNr = params.get('artNr') || '29009';
      setArtNr(currentArtNr);

      try {
        setLoading(true);
        const response = await fetch(`${N8N_API_URL}?artNr=${currentArtNr}`);
        
        if (!response.ok) throw new Error("API-Verbindung fehlgeschlagen");
        
        const data = await response.json();
        const dbResult = Array.isArray(data) ? data[0] : data;
        
        if (!dbResult || !dbResult.canvas_data) throw new Error("Keine Daten in DB gefunden");

        setProject({
          activePage: 'page_0',
          ...dbResult.canvas_data.project
        });
        setStatus('live');
      } catch (err) {
        console.warn("API nicht erreichbar, wechsle in lokalen Modus:", err.message);
        setProject({
          activePage: 'page_0',
          ...MOCK_PROJECT
        });
        setStatus('local');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateElement = (id, updates) => {
    if (!project) return;
    setProject(prev => ({
      ...prev,
      objects: {
        ...prev.objects,
        [id]: { ...prev.objects[id], ...updates }
      }
    }));
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4 text-slate-400 font-sans">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <p className="font-medium animate-pulse tracking-tight text-sm">Initialisiere RSP Editor...</p>
    </div>
  );

  const currentPage = project.pages[project.activePage];
  const pageObjects = currentPage.objectsIds.map(id => project.objects[id]);
  const selectedElement = selectedId ? project.objects[selectedId] : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left">
      {/* Sidebar Navigation */}
      <aside className="w-16 bg-slate-900 flex flex-col items-center py-6 gap-6 text-slate-400 shadow-2xl">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mb-4 italic shadow-lg">RSP</div>
        <button className="p-2 text-white border-b-2 border-indigo-500">1</button>
        <div className="mt-auto border-t border-slate-700 pt-6">
           <button onClick={() => setShowBleed(!showBleed)} className={`p-2 rounded-md transition-all ${showBleed ? 'text-indigo-400 bg-slate-800' : 'hover:text-white'}`}>
            {showBleed ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </aside>

      {/* Eigenschaften-Panel */}
      <aside className="w-80 bg-white border-l border-slate-200 p-6 shadow-xl z-10 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings2 size={16} className="text-indigo-600" />
          <h2 className="font-bold uppercase text-[10px] tracking-[0.2em] text-slate-400">Editor</h2>
        </div>

        {status === 'local' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800 items-start shadow-sm">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div className="text-[10px] leading-tight opacity-90 text-left">
              <p className="font-bold mb-1 uppercase tracking-tight">Offline-Vorschau</p>
              Daten kommen aus dem lokalen Speicher. Bilder müssen im Ordner /assets/ liegen.
            </div>
          </div>
        )}

        {selectedElement ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">Element-Sperre</span>
                <span className="text-[10px] text-slate-400">{selectedElement.isLocked ? 'Position fixiert' : 'Frei beweglich'}</span>
              </div>
              <button 
                onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                className={`p-2.5 rounded-xl transition-all shadow-sm ${selectedElement.isLocked ? 'bg-white text-amber-500 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}
              >
                {selectedElement.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
              </button>
            </div>

            {selectedElement.type === 'text' && (
              <div className="space-y-3 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Text bearbeiten</label>
                <textarea 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm h-40 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner bg-slate-50/50"
                  value={selectedElement.content || ""}
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                />
              </div>
            )}
            
            {selectedElement.type === 'image' && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-left">
                <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest block mb-2">Bild-Info</label>
                <p className="text-[11px] font-mono text-indigo-600 truncate">{selectedElement.linkedFileName}</p>
                <p className="text-[9px] text-indigo-400 mt-2 italic">Hinweis: Bild wird basierend auf InDesign-Daten skaliert.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40">
            <Layers size={32} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center px-4 leading-relaxed">Bitte wählen Sie ein Element zum Bearbeiten</p>
          </div>
        )}
      </aside>

      {/* Editor-Zentrum */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-sm">
          <div className="flex flex-col text-left">
              <span className={`text-[10px] uppercase font-bold tracking-widest leading-none mb-1 ${status === 'local' ? 'text-amber-500' : 'text-indigo-600'}`}>
                {status === 'local' ? 'Status: Lokal' : 'Status: Live'}
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-800">{project.name}</span>
          </div>
          <button className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
            <Save size={16} /> Entwurf speichern
          </button>
        </header>

        <div className="flex-1 overflow-auto bg-slate-200 p-20 flex items-start justify-center custom-scrollbar">
          <div 
            className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative transition-all duration-500"
            style={{ 
                width: `${currentPage.width}px`, 
                height: `${currentPage.height}px`,
                transform: 'scale(1.2)',
                transformOrigin: 'top center'
            }}
          >
            {/* Bleed-Anzeige */}
            {showBleed && (
              <div 
                className="absolute inset-0 border-red-500/20 border-dashed pointer-events-none z-50"
                style={{
                  borderTopWidth: `${currentPage.boxes.trimbox.top}px`,
                  borderRightWidth: `${currentPage.boxes.trimbox.right}px`,
                  borderBottomWidth: `${currentPage.boxes.trimbox.bottom}px`,
                  borderLeftWidth: `${currentPage.boxes.trimbox.left}px`,
                }}
              />
            )}

            {/* Objekte-Renderer */}
            {pageObjects.map(obj => (
              <div
                key={obj.id}
                onClick={() => setSelectedId(obj.id)}
                className={`absolute cursor-pointer transition-all duration-200 text-left ${selectedId === obj.id ? 'ring-2 ring-indigo-500 z-20 shadow-xl' : 'hover:ring-1 hover:ring-indigo-300 z-10'}`}
                style={{
                  top: `${obj.top}px`,
                  left: `${obj.left}px`,
                  width: `${obj.width}px`,
                  height: `${obj.height}px`,
                  overflow: 'hidden' // Wichtig für Bildbeschnitt
                }}
              >
                {obj.type === 'image' ? (
                  <div className="relative w-full h-full bg-slate-50">
                    <img 
                      /* HINWEIS: 'public' wird im Pfad weggelassen, da Vite den public-Ordner als Root nutzt */
                      src={`/assets/${artNr}/${obj.linkedFileName}`}
                      alt={obj.id}
                      className="absolute max-w-none pointer-events-none"
                      style={{
                        top: obj.contentTransform ? `${obj.contentTransform.topOffset}px` : 0,
                        left: obj.contentTransform ? `${obj.contentTransform.leftOffset}px` : 0,
                        width: obj.contentTransform ? `${obj.contentTransform.contentWidth}px` : '100%',
                        height: obj.contentTransform ? `${obj.contentTransform.contentHeight}px` : 'auto',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback-Platzhalter */}
                    <div className="hidden absolute inset-0 flex flex-col items-center justify-center p-2 border border-slate-100 text-slate-300">
                        <span className="text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50 italic">Bild fehlt</span>
                        <span className="text-[8px] font-mono break-all text-center px-4">{obj.linkedFileName}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: `${obj.fontSize}px`, 
                    fontFamily: obj.fontFamily, 
                    color: '#000',
                    lineHeight: 1.1,
                    whiteSpace: 'pre-wrap',
                    padding: '2px'
                  }}>
                    {obj.content}
                  </div>
                )}
                {obj.isLocked && selectedId === obj.id && (
                  <div className="absolute top-1 right-1 p-1 bg-amber-500 text-white rounded shadow-sm scale-75">
                    <Lock size={12}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

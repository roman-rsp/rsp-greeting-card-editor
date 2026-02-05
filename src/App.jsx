import React, { useState, useEffect } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, ChevronLeft, Loader2, AlertCircle
} from 'lucide-react';

/**
 * RSP KUNSTVERLAG - LIVE EDITOR
 * Mit erweitertem Debugging-Modus für n8n-Anbindung.
 */

const App = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showBleed, setShowBleed] = useState(true);

  // Deine n8n Production URL
  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      const artNr = params.get('artNr') || '29009';

      console.log(`[Editor] Starte Datenabruf für Artikel: ${artNr}`);
      console.log(`[Editor] Ziel-URL: ${N8N_API_URL}`);

      try {
        setLoading(true);
        
        // Fetch mit Timeout, damit wir wissen, ob die Verbindung hängt
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${N8N_API_URL}?artNr=${artNr}`, {
          signal: controller.signal
        });
        
        clearTimeout(id);
        console.log(`[Editor] n8n Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`n8n Server-Fehler: ${response.status}. Prüfe den n8n-Workflow Status.`);
        }
        
        const data = await response.json();
        console.log("[Editor] Daten erfolgreich empfangen:", data);
        
        const dbResult = Array.isArray(data) ? data[0] : data;
        
        if (!dbResult || !dbResult.canvas_data) {
          throw new Error(`Keine Layout-Daten für Karte ${artNr} gefunden.`);
        }

        setProject({
          activePage: 'page_0',
          ...dbResult.canvas_data.project
        });
        setLoading(false);
      } catch (err) {
        console.error("[Editor] Kritischer Ladefehler:", err);
        setError(err.name === 'AbortError' ? "Zeitüberschreitung bei der Verbindung zu n8n." : err.message);
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
    <div className="flex-1 flex flex-col items-center justify-center bg-white gap-4 text-slate-500 font-sans min-h-screen">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <p className="font-medium animate-pulse tracking-tight">Verbindung zum RSP-Server...</p>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-6 text-red-600 p-8 text-center font-sans min-h-screen">
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-red-100 max-w-lg">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Editor konnte nicht geladen werden</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
        <div className="text-left bg-slate-50 p-4 rounded-xl text-[11px] text-slate-400 space-y-2 mb-8 border border-slate-100">
          <p className="font-bold text-slate-600 uppercase">Checkliste für Roman:</p>
          <ul className="list-disc ml-4">
            <li>Ist der Workflow in n8n auf <strong>Active</strong> (Grün)?</li>
            <li>Ist im n8n-Webhook <strong>CORS (*)</strong> erlaubt?</li>
            <li>Funktioniert der Direktaufruf der n8n-URL im Browser?</li>
          </ul>
        </div>
        <button onClick={() => window.location.reload()} className="w-full py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
          Erneut versuchen
        </button>
      </div>
    </div>
  );

  const currentPage = project.pages[project.activePage];
  const pageObjects = currentPage.objectsIds.map(id => project.objects[id]);
  const selectedElement = selectedId ? project.objects[selectedId] : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left">
      <aside className="w-16 bg-slate-900 flex flex-col items-center py-6 gap-6 text-slate-400 shadow-2xl">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mb-4 italic">RSP</div>
        <button className="p-2 text-white border-b-2 border-indigo-500">1</button>
        <div className="mt-auto border-t border-slate-700 pt-6">
           <button onClick={() => setShowBleed(!showBleed)} className={`p-2 rounded-md transition-all ${showBleed ? 'text-indigo-400 bg-slate-800' : 'hover:text-white'}`}>
            {showBleed ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </aside>

      <aside className="w-80 bg-white border-l border-slate-200 p-6 shadow-xl z-10 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings2 size={16} className="text-indigo-600" />
          <h2 className="font-bold uppercase text-[10px] tracking-[0.2em] text-slate-400">Eigenschaften</h2>
        </div>

        {selectedElement ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 tracking-tight">Status</span>
                <span className="text-[10px] text-slate-400">{selectedElement.isLocked ? 'Element fixiert' : 'Beweglich'}</span>
              </div>
              <button 
                onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                className={`p-2.5 rounded-xl transition-all shadow-sm ${selectedElement.isLocked ? 'bg-white text-amber-500 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}
              >
                {selectedElement.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
              </button>
            </div>

            {selectedElement.type === 'text' && (
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block text-left">Textinhalt</label>
                <textarea 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm h-40 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner bg-slate-50/50"
                  value={selectedElement.content || ""}
                  onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40">
            <Layers size={32} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center px-4 leading-relaxed">Bitte wählen Sie ein Element</p>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden text-left">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-sm">
          <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-widest leading-none mb-1">Live Vorschau</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">{project.name}</span>
          </div>
          <button className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
            <Save size={16} /> Speichern
          </button>
        </header>

        <div className="flex-1 overflow-auto bg-slate-200 p-20 flex items-start justify-center">
          <div 
            className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative transition-all duration-500"
            style={{ 
                width: `${currentPage.width}px`, 
                height: `${currentPage.height}px`,
                transform: 'scale(1.2)',
                transformOrigin: 'top center'
            }}
          >
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
                  overflow: 'hidden'
                }}
              >
                {obj.type === 'image' ? (
                  <div className="relative w-full h-full bg-slate-50 flex flex-col items-center justify-center p-2 border border-slate-100">
                    <div className="text-[10px] text-slate-400 text-center break-all font-mono leading-tight">
                        {obj.linkedFileName}
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

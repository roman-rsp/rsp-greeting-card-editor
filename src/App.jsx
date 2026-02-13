import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings2, Lock, Unlock, Eye, EyeOff, 
  Layers, Save, Loader2, Info, Image as ImageIcon, 
  Layout, CheckCircle2, ChevronRight, RefreshCw
} from 'lucide-react';

/**
 * RSP KUNSTVERLAG - EDITOR V3.2
 * Fokus: Dynamische Bild-Injektion & Layout-Galerie Simulation
 */

const App = () => {
  // State für die geladenen Vorlagen
  const [project, setProject] = useState({ front: null, inside: null });
  // Daten vom Shop (simuliert über URL)
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
  
  // Infrastruktur-Konfiguration
  const ASSET_SERVER = "https://assets.rsp-kunstverlag.de"; 
  const N8N_API_URL = "https://n8n-f8jg4-u44283.vm.elestio.app/webhook/get-template";

  // Funktion zum Laden eines einzelnen Templates
  const fetchTemplate = useCallback(async (templateId) => {
    try {
      const response = await fetch(`${N8N_API_URL}?artNr=${templateId}`);
      const data = await response.json();
      return (Array.isArray(data) ? data[0] : data).canvas_data.project;
    } catch (err) {
      console.error(`Fehler beim Laden von ${templateId}:`, err);
      return null;
    }
  }, []);

  // Initiales Laden beim Start (Handshake mit Shop)
  useEffect(() => {
    const initFromShop = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const config = {
        artNr: urlParams.get('artNr') || '29009',
        frontId: urlParams.get('front') || 'wk_motiv',
        insideId: urlParams.get('inside') || 'wk_In_1',
        session: urlParams.get('session') || 'test-session-001'
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

  // Wechselt das Layout der Innenseite (Galerie-Funktion)
  const changeInsideLayout = async (newInsideId) => {
    setLoading(true);
    const newProject = await fetchTemplate(newInsideId);
    if (newProject) {
      setProject(prev => ({ ...prev, inside: newProject }));
      setShopContext(prev => ({ ...prev, insideId: newInsideId }));
      setSelectedId(null);
    }
    setLoading(false);
  };

  // Bestimmt die Bildquelle basierend auf InDesign-Variablen
  const getImgSrc = (obj) => {
    // Spezialfall: Das Master-Motiv auf der Vorderseite
    if (obj.metadata?.['editor:dynamic-source'] === 'auto_filename') {
      return `${ASSET_SERVER}/fronts/${shopContext.artNr}.jpg`;
    }
    // Standardfall: Lokale Assets aus dem Artikelordner
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
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400">Layout-Engine wird synchronisiert</p>
    </div>
  );

  const currentProject = activeSide === 'front' ? project.front : project.inside;
  const currentPage = currentProject.pages['page_0'];
  const objects = currentPage.objectsIds.map(id => currentProject.objects[id]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden text-left">
      
      {/* Linke Nav: Seiten-Switcher */}
      <nav className="w-24 bg-slate-900 flex flex-col items-center py-8 gap-10 shadow-2xl z-40">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold italic shadow-lg text-xl">RSP</div>
        
        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setActiveSide('front'); setSelectedId(null); }}
            className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'front' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-14 h-20 rounded-lg border-2 flex items-center justify-center ${activeSide === 'front' ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-700'}`}>
              <ImageIcon size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Aussen</span>
          </button>

          <button 
            onClick={() => { setActiveSide('inside'); setSelectedId(null); }}
            className={`flex flex-col items-center gap-2 transition-all ${activeSide === 'inside' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`w-14 h-20 rounded-lg border-2 flex items-center justify-center ${activeSide === 'inside' ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-700'}`}>
              <Layout size={20} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">Innen</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4">
           <button onClick={() => setShowBleed(!showBleed)} className={`p-3 rounded-xl transition-all ${showBleed ? 'text-indigo-400 bg-slate-800' : 'text-slate-600 hover:text-white'}`}>
            {showBleed ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </nav>

      {/* Hauptbereich */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-20">
          <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-[0.2em] mb-1">Produkt-Konfigurator</span>
              <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Art. {shopContext.artNr} — Seite: {activeSide === 'front' ? 'Vorderseite' : 'Innenseite'}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
              <CheckCircle2 size={16} /> Fertigstellen
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-slate-200/50 p-20 flex items-start justify-center custom-scrollbar">
          <div 
            className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative transition-all duration-500"
            style={{ 
                width: `${currentPage.width}px`, 
                height: `${currentPage.height}px`,
                transform: 'scale(1.1)',
                transformOrigin: 'top center'
            }}
          >
            {showBleed && (
              <div className="absolute inset-0 border-red-500/10 border-dashed pointer-events-none z-50"
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
                className={`absolute transition-all ${obj.layer !== 'unten' ? 'cursor-pointer hover:ring-1 hover:ring-indigo-300' : 'pointer-events-none'} ${selectedId === obj.id ? 'ring-2 ring-indigo-500 z-20 shadow-xl' : ''}`}
                style={{
                  top: `${obj.top}px`, left: `${obj.left}px`,
                  width: `${obj.width}px`, height: `${obj.height}px`,
                  overflow: 'hidden'
                }}
              >
                {obj.type === 'image' ? (
                  <img src={getImgSrc(obj)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div style={{ fontSize: `${obj.fontSize}px`, fontFamily: obj.fontFamily || 'sans-serif', color: '#1e293b', lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
                    {obj.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Rechte Sidebar: Inspektor & Galerie */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40">
        <div className="p-8 border-b border-slate-100 flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Galerie: Nur anzeigen, wenn Innenseite aktiv ist */}
            {activeSide === 'inside' && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                    <h2 className="font-bold uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                        <RefreshCw size={12} /> Layout-Vorschläge
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {['wk_In_1', 'wk_In_2', 'wk_In_3'].map(id => (
                            <button 
                                key={id}
                                onClick={() => changeInsideLayout(id)}
                                className={`h-24 rounded-xl border-2 flex items-center justify-center text-[10px] font-bold transition-all ${shopContext.insideId === id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 hover:border-slate-300 text-slate-400'}`}
                            >
                                {id.split('_').pop()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="font-bold uppercase text-[10px] tracking-[0.3em] text-slate-400 mb-6">Editor</h2>
            
            {selectedId && currentProject.objects[selectedId].type === 'text' ? (
                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-2">Textinhalt</span>
                        <textarea 
                            className="w-full bg-transparent border-none outline-none text-sm text-slate-600 h-32 resize-none leading-relaxed"
                            value={currentProject.objects[selectedId].content}
                            onChange={(e) => handleTextUpdate(selectedId, e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <div className

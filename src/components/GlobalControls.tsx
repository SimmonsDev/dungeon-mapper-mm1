import React, { useRef, useState } from 'react';
import { ProjectData } from '../types';

interface GlobalControlsProps {
  crtEffect: boolean;
  onToggleCrt: () => void;
  onExport: () => void;
  onImport: (data: ProjectData) => void;
  onReset: () => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  crtEffect,
  onToggleCrt,
  onExport,
  onImport,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Simple structure validation
        if (parsed && typeof parsed === 'object' && parsed.maps && parsed.currentMapId) {
          onImport(parsed as ProjectData);
          alert('Map database successfully imported!');
        } else {
          alert('Invalid map file. Could not find valid maps database.');
        }
      } catch (err) {
        alert('Failed to parse JSON file. Make sure it is a valid export.');
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = '';
  };

  const handleResetClick = () => {
    if (window.confirm('WARNING: This will delete ALL current maps. Are you sure you want to reset?')) {
      onReset();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      <button className="btn" onClick={() => setShowHelp(true)} title="Keyboard Shortcuts Help">
        ⌨️ Help
      </button>

      <button className="btn btn-primary" onClick={onExport} title="Export maps database as JSON">
        💾 Export JSON
      </button>

      <button 
        className="btn btn-amber" 
        onClick={() => fileInputRef.current?.click()} 
        title="Import maps database from JSON"
      >
        📂 Import JSON
      </button>

      <button 
        className={`btn ${crtEffect ? 'btn-primary' : ''}`} 
        onClick={onToggleCrt}
        title="Toggle CRT Retro Filter"
      >
        📺 CRT: {crtEffect ? 'ON' : 'OFF'}
      </button>

      <button className="btn btn-red" onClick={handleResetClick} title="Reset all maps to default">
        🗑 Reset All
      </button>

      {/* Help Modal Overlay */}
      {showHelp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '500px' }}>
            <div className="modal-title">Keyboard Shortcuts & Commands</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1.1rem' }}>
              <p>Move the selection cursor quickly and build your dungeon map using shortcuts:</p>
              
              <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                <div style={{ color: 'var(--ega-amber)', fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  Navigation & Painting
                </div>
                <div className="hotkey-legend">
                  <div className="hotkey-item">
                    <span className="key-cap">▲▼◀▶</span> Move selection cursor
                  </div>
                  <div className="hotkey-item">
                    <span className="key-cap">Space</span> Paint cursor with active terrain
                  </div>
                  <div className="hotkey-item">
                    <span className="key-cap">1 - 6</span> Change active terrain brush
                  </div>
                  <div className="hotkey-item">
                    <span className="key-cap">ESC</span> Reset brush to Select/Inspector mode
                  </div>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--ega-amber)', fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  Direct Wall/Edge Painting (Selected Tile)
                </div>
                <div className="hotkey-legend">
                  <div className="hotkey-item">
                    <span className="key-cap">N</span> Toggle North edge wall
                  </div>
                  <div className="hotkey-item">
                    <span className="key-cap">S</span> Toggle South edge wall
                  </div>
                  <div className="hotkey-item">
                    <span className="key-cap">E</span> Toggle East edge wall
                  </div>
                  <div className="hotkey-item">
                    <span className="key-cap">W</span> Toggle West edge wall
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '0.95rem', color: '#888', fontStyle: 'italic' }}>
                Tip: You can also hover over the outer edges of any tile on the grid and click to draw walls directly!
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowHelp(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

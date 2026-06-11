import React from 'react';
import { TileType, EdgeType, ObjectType, EncounterType } from '../types';
import { TILE_TYPES, EDGE_TYPES, OBJECT_TYPES, ENCOUNTER_TYPES } from '../constants';

interface ToolbarProps {
  activeTool: {
    type: 'select' | 'terrain' | 'wall' | 'object' | 'encounter';
    value: string;
  };
  onChangeTool: (toolType: 'select' | 'terrain' | 'wall' | 'object' | 'encounter', toolValue: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onChangeTool }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      {/* Selection Mode */}
      <div className="sidebar-section" style={{ borderBottom: '1px solid #222', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTool.type === 'select' ? 'btn-primary' : ''}`}
          style={{ width: '100%' }}
          onClick={() => onChangeTool('select', 'none')}
        >
          🔍 Select & Inspect Tile
        </button>
      </div>

      {/* Terrains */}
      <div className="sidebar-section" style={{ borderBottom: '1px solid #222', paddingBottom: '12px' }}>
        <div className="sidebar-title">🖌 Paint Terrains</div>
        <div className="tool-grid">
          {Object.entries(TILE_TYPES).map(([key, meta]) => (
            <button
              key={key}
              className={`tool-item ${activeTool.type === 'terrain' && activeTool.value === key ? 'active' : ''}`}
              onClick={() => onChangeTool('terrain', key)}
              title={meta.desc}
            >
              <div className="tool-color-box" style={{ backgroundColor: meta.color }} />
              <span style={{ fontSize: '0.9rem' }}>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Walls */}
      <div className="sidebar-section" style={{ borderBottom: '1px solid #222', paddingBottom: '12px' }}>
        <div className="sidebar-title">🧱 Wall / Edge Tool</div>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
          Select a wall type below, then click tile borders directly on the map to paint them.
        </p>
        <div className="tool-grid">
          {Object.entries(EDGE_TYPES).map(([key, meta]) => (
            <button
              key={key}
              className={`tool-item ${activeTool.type === 'wall' && activeTool.value === key ? 'active' : ''}`}
              onClick={() => onChangeTool('wall', key)}
              style={{ fontSize: '0.85rem' }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '4px',
                  backgroundColor: meta.color,
                  border: meta.style === 'dashed' ? '1px dashed' : 'none',
                }}
              />
              <span>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Objects / POIs */}
      <div className="sidebar-section" style={{ borderBottom: '1px solid #222', paddingBottom: '12px', flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-title">🏛 Place Objects / POIs</div>
        <div className="tool-grid">
          {Object.entries(OBJECT_TYPES).map(([key, meta]) => {
            if (key === 'none') return null;
            return (
              <button
                key={key}
                className={`tool-item ${activeTool.type === 'object' && activeTool.value === key ? 'active' : ''}`}
                onClick={() => onChangeTool('object', key)}
                title={meta.desc}
                style={{ height: '38px', justifyContent: 'flex-start', padding: '4px 8px' }}
              >
                <span style={{ color: meta.color, width: '20px', textAlign: 'center', fontSize: '1.1rem' }}>
                  {meta.symbol}
                </span>
                <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Encounters */}
      <div className="sidebar-section" style={{ paddingTop: '5px' }}>
        <div className="sidebar-title">💀 Encounter Rates</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(ENCOUNTER_TYPES).map(([key, meta]) => (
            <button
              key={key}
              className={`tool-item ${activeTool.type === 'encounter' && activeTool.value === key ? 'active' : ''}`}
              onClick={() => onChangeTool('encounter', key)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <span style={{ color: meta.color, width: '20px', textAlign: 'center' }}>
                {meta.symbol || '•'}
              </span>
              <span style={{ fontSize: '0.9rem' }}>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

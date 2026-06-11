import React, { useState } from 'react';
import { DungeonMap, TileType } from '../types';
import { TILE_TYPES } from '../constants';

interface MapListProps {
  maps: Record<string, DungeonMap>;
  currentMapId: string;
  onSelectMap: (mapId: string) => void;
  onCreateMap: (name: string, defaultTerrain: TileType, addBorders: boolean) => void;
  onDeleteMap: (mapId: string) => void;
  onRenameMap: (mapId: string, newName: string) => void;
  onAddBorders: (mapId: string) => void;
}

export const MapList: React.FC<MapListProps> = ({
  maps,
  currentMapId,
  onSelectMap,
  onCreateMap,
  onDeleteMap,
  onRenameMap,
  onAddBorders,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [defaultTerrain, setDefaultTerrain] = useState<TileType>('dungeon');
  const [addBorders, setAddBorders] = useState(true);
  
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editMapName, setEditMapName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    onCreateMap(newMapName.trim(), defaultTerrain, addBorders);
    setNewMapName('');
    setShowCreateModal(false);
  };

  const startRename = (map: DungeonMap) => {
    setEditingMapId(map.id);
    setEditMapName(map.name);
  };

  const saveRename = (mapId: string) => {
    if (editMapName.trim()) {
      onRenameMap(mapId, editMapName.trim());
    }
    setEditingMapId(null);
  };

  const handleTerrainChange = (terrain: TileType) => {
    setDefaultTerrain(terrain);
    // Auto toggle borders: dungeon/solid gets borders, open/forest/water/road does not
    if (['dungeon', 'solid'].includes(terrain)) {
      setAddBorders(true);
    } else {
      setAddBorders(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', minHeight: 0, flex: 1 }}>
      <button
        className="btn btn-primary"
        style={{ width: '100%', fontFamily: 'var(--font-pixel)', fontSize: '0.8rem' }}
        onClick={() => {
          setNewMapName(`Level ${Object.keys(maps).length + 1}`);
          setShowCreateModal(true);
        }}
      >
        ➕ Create New Map
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.values(maps).map((map) => {
          const isSelected = map.id === currentMapId;
          const isEditing = map.id === editingMapId;

          return (
            <div
              key={map.id}
              style={{
                border: `1px solid ${isSelected ? 'var(--ega-green)' : '#222'}`,
                backgroundColor: isSelected ? '#0d1a0d' : '#141414',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '2px 4px', fontSize: '1.1rem' }}
                    value={editMapName}
                    onChange={(e) => setEditMapName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(map.id);
                      if (e.key === 'Escape') setEditingMapId(null);
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: '2px 8px', fontSize: '1rem' }}
                    onClick={() => saveRename(map.id)}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      cursor: 'pointer',
                      fontFamily: isSelected ? 'var(--font-pixel)' : 'var(--font-terminal)',
                      fontSize: isSelected ? '0.75rem' : '1.2rem',
                      color: isSelected ? 'var(--ega-green)' : 'var(--text-color)',
                      textShadow: isSelected ? '0 0 4px var(--ega-green-glow)' : 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                      padding: '4px 0',
                    }}
                    onClick={() => onSelectMap(map.id)}
                  >
                    {map.name}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn"
                      style={{ padding: '2px 6px', fontSize: '0.9rem', borderColor: '#333' }}
                      onClick={() => startRename(map)}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-red"
                      style={{ padding: '2px 6px', fontSize: '0.9rem' }}
                      onClick={() => onDeleteMap(map.id)}
                      disabled={Object.keys(maps).length <= 1}
                      title="Delete Map"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
              
              {isSelected && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                  <button
                    className="btn btn-amber"
                    style={{ flex: 1, padding: '1px 4px', fontSize: '0.9rem' }}
                    onClick={() => onAddBorders(map.id)}
                    title="Add Solid Wall borders to all edges of this map"
                  >
                    ➕ Border Walls
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retro Styled Create Map Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Create New Dungeon Map</div>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <span className="form-label">Map Name</span>
                <input
                  type="text"
                  className="form-input"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="e.g. Middlegate Castle L1"
                  required
                  autoFocus
                />
              </div>

              <div>
                <span className="form-label">Default Floor Terrain</span>
                <select
                  className="form-select"
                  value={defaultTerrain}
                  onChange={(e) => handleTerrainChange(e.target.value as TileType)}
                >
                  {Object.entries(TILE_TYPES).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label} ({meta.desc})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="add-borders-checkbox"
                  checked={addBorders}
                  onChange={(e) => setAddBorders(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="add-borders-checkbox" style={{ fontSize: '1rem', cursor: 'pointer', userSelect: 'none' }}>
                  Surround map with border walls
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Create Map
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

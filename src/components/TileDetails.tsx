import React, { useState, useEffect } from 'react';
import { Tile, DungeonMap, TileType, EdgeType, ObjectType, EncounterType, MapConnection } from '../types';
import { TILE_TYPES, EDGE_TYPES, OBJECT_TYPES, ENCOUNTER_TYPES } from '../constants';

interface TileDetailsProps {
  tile: Tile | null;
  maps: Record<string, DungeonMap>;
  onUpdateTile: (tile: Tile) => void;
  onNavigateTo: (mapId: string, x: number, y: number) => void;
  onCreateAndLinkMap: (mapName: string, defaultTerrain: TileType, targetX: number, targetY: number) => void;
}

export const TileDetails: React.FC<TileDetailsProps> = ({
  tile,
  maps,
  onUpdateTile,
  onNavigateTo,
  onCreateAndLinkMap,
}) => {
  const [targetMapId, setTargetMapId] = useState('');
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [showNewMapForm, setShowNewMapForm] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapTerrain, setNewMapTerrain] = useState<TileType>('dungeon');

  // Sync state with tile when selection changes
  useEffect(() => {
    if (tile) {
      if (tile.connection) {
        setTargetMapId(tile.connection.targetMapId);
        setTargetX(tile.connection.targetX);
        setTargetY(tile.connection.targetY);
      } else {
        // Find first map in list that isn't current, or leave empty
        const mapKeys = Object.keys(maps);
        setTargetMapId(mapKeys[0] || '');
        setTargetX(tile.x);
        setTargetY(tile.y);
      }
      setShowNewMapForm(false);
    }
  }, [tile, maps]);

  if (!tile) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No tile selected.<br />Click on the grid to inspect details.
      </div>
    );
  }

  const handleUpdateField = <K extends keyof Tile>(key: K, value: Tile[K]) => {
    onUpdateTile({
      ...tile,
      [key]: value,
    });
  };

  const handleUpdateEdge = (direction: 'n' | 's' | 'e' | 'w', type: EdgeType) => {
    onUpdateTile({
      ...tile,
      edges: {
        ...tile.edges,
        [direction]: { type },
      },
    });
  };

  const handleSetConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMapId) return;
    
    const connection: MapConnection = {
      targetMapId,
      targetX: Math.min(15, Math.max(0, targetX)),
      targetY: Math.min(15, Math.max(0, targetY)),
    };
    
    handleUpdateField('connection', connection);
  };

  const handleClearConnection = () => {
    handleUpdateField('connection', undefined);
  };

  const handleCreateAndLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    onCreateAndLinkMap(newMapName.trim(), newMapTerrain, tile.x, tile.y);
    setNewMapName('');
    setShowNewMapForm(false);
  };

  // Determine if this tile can support a map connection (e.g. stairs, portals)
  const isLinkable = ['stairs_up', 'stairs_down', 'portal', 'custom'].includes(tile.content);

  return (
    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div>
        <span className="form-label">Selected Tile</span>
        <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-pixel)', color: 'var(--ega-amber)' }}>
          Coords: ({tile.x}, {tile.y})
        </div>
      </div>

      {/* Terrain Type */}
      <div>
        <label className="form-label">Terrain Background</label>
        <select
          className="form-select"
          value={tile.type}
          onChange={(e) => handleUpdateField('type', e.target.value as TileType)}
        >
          {Object.entries(TILE_TYPES).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Wall/Edge Editors */}
      <div>
        <label className="form-label">Walls & Edges</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
          {(['n', 's', 'e', 'w'] as const).map((dir) => (
            <div key={dir} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#888' }}>
                {dir === 'n' ? 'North' : dir === 's' ? 'South' : dir === 'e' ? 'East' : 'West'}
              </span>
              <select
                className="form-select"
                style={{ padding: '4px', fontSize: '1.05rem', marginTop: '2px' }}
                value={tile.edges[dir].type}
                onChange={(e) => handleUpdateEdge(dir, e.target.value as EdgeType)}
              >
                {Object.entries(EDGE_TYPES).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Tile Content (POIs) */}
      <div>
        <label className="form-label">Tile Contents</label>
        <select
          className="form-select"
          value={tile.content}
          onChange={(e) => handleUpdateField('content', e.target.value as ObjectType)}
        >
          {Object.entries(OBJECT_TYPES).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.symbol ? `${meta.symbol} ` : ''}{meta.label}
            </option>
          ))}
        </select>

        {tile.content !== 'none' && (
          <div style={{ marginTop: '8px' }}>
            <span className="form-label">Custom Label / Shop Name</span>
            <input
              type="text"
              className="form-input"
              value={tile.contentLabel || ''}
              placeholder="e.g. Weapons, Temple of Yak"
              onChange={(e) => handleUpdateField('contentLabel', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Encounter Settings */}
      <div>
        <label className="form-label">Encounter Hotspot</label>
        <select
          className="form-select"
          value={tile.encounter}
          onChange={(e) => handleUpdateField('encounter', e.target.value as EncounterType)}
        >
          {Object.entries(ENCOUNTER_TYPES).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="form-label">Tile Notes / Log</label>
        <textarea
          className="form-textarea"
          style={{ height: '70px', resize: 'vertical' }}
          placeholder="Enter events, messages, secrets found at this coordinate..."
          value={tile.notes || ''}
          onChange={(e) => handleUpdateField('notes', e.target.value)}
        />
      </div>

      {/* Connection Settings (Only for stairs/portals) */}
      {isLinkable && (
        <div style={{ border: '1px solid var(--border-color)', padding: '10px', backgroundColor: '#0c0c0c' }}>
          <div className="sidebar-title" style={{ fontSize: '0.75rem', marginBottom: '8px', color: 'var(--ega-magenta)' }}>
            🔗 Link Coordinates
          </div>

          {tile.connection ? (
            <div>
              <p style={{ fontSize: '0.95rem', marginBottom: '10px' }}>
                Connected to: <strong>{maps[tile.connection.targetMapId]?.name || tile.connection.targetMapId}</strong> at ({tile.connection.targetX}, {tile.connection.targetY})
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '1.05rem', padding: '4px' }}
                  onClick={() =>
                    onNavigateTo(
                      tile.connection!.targetMapId,
                      tile.connection!.targetX,
                      tile.connection!.targetY
                    )
                  }
                >
                  🚀 Go to Destination
                </button>
                <button
                  className="btn btn-red"
                  style={{ fontSize: '1.05rem', padding: '4px' }}
                  onClick={handleClearConnection}
                  title="Unlink"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div>
              {!showNewMapForm ? (
                <div>
                  <form onSubmit={handleSetConnection} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span className="form-label" style={{ fontSize: '0.65rem' }}>Select Map</span>
                      <select
                        className="form-select"
                        style={{ padding: '4px', fontSize: '1.1rem' }}
                        value={targetMapId}
                        onChange={(e) => setTargetMapId(e.target.value)}
                      >
                        <option value="">-- Select Map --</option>
                        {Object.values(maps).map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <span className="form-label" style={{ fontSize: '0.65rem' }}>Dest X (0-15)</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          className="form-input"
                          style={{ padding: '4px', fontSize: '1.1rem' }}
                          value={targetX}
                          onChange={(e) => setTargetX(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="form-label" style={{ fontSize: '0.65rem' }}>Dest Y (0-15)</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          className="form-input"
                          style={{ padding: '4px', fontSize: '1.1rem' }}
                          value={targetY}
                          onChange={(e) => setTargetY(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-amber"
                      style={{ fontSize: '1.1rem', padding: '4px', marginTop: '4px' }}
                      disabled={!targetMapId}
                    >
                      Connect Coordinates
                    </button>
                  </form>

                  <div style={{ textAlign: 'center', margin: '10px 0', fontSize: '0.8rem', color: '#555' }}>— OR —</div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '1.1rem', padding: '4px' }}
                    onClick={() => setShowNewMapForm(true)}
                  >
                    ➕ Create & Link New Map
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateAndLinkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span className="form-label" style={{ fontSize: '0.65rem' }}>New Map Name</span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px', fontSize: '1.1rem' }}
                      placeholder="e.g. Town Dungeon L2"
                      value={newMapName}
                      onChange={(e) => setNewMapName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <span className="form-label" style={{ fontSize: '0.65rem' }}>Default Terrain</span>
                    <select
                      className="form-select"
                      style={{ padding: '4px', fontSize: '1.1rem' }}
                      value={newMapTerrain}
                      onChange={(e) => setNewMapTerrain(e.target.value as TileType)}
                    >
                      {Object.entries(TILE_TYPES).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                      ))}
                    </select>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#888' }}>
                    Note: Bidirectional connections will be created automatically at coordinate ({tile.x}, {tile.y}).
                  </p>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '1.1rem', padding: '4px' }}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: '1.1rem', padding: '4px' }}
                      onClick={() => setShowNewMapForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

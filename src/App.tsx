import { useEffect, useMemo, useRef, useState } from 'react';

type Terrain = 'dungeon' | 'path' | 'forest' | 'solid';
type Feature = 'none' | 'statue' | 'store' | 'temple' | 'trap' | 'portal' | 'stairs';
type Encounter = 'none' | 'random' | 'always';
type SideState = 'wall' | 'door' | 'gate' | 'window' | 'secret' | 'open';

interface Connection {
  toMap: string;
  coords: string;
  side: 'N' | 'S' | 'E' | 'W';
  note: string;
}

interface TileData {
  id: string;
  terrain: Terrain;
  feature: Feature;
  encounter: Encounter;
  sideN: SideState;
  sideS: SideState;
  sideE: SideState;
  sideW: SideState;
  notes: string;
  connections: Connection[];
}

interface MapDocument {
  name: string;
  width: number;
  height: number;
  tiles: TileData[];
  lastUpdated: string;
}

const DEFAULT_MAP_NAME = 'City Dungeon Level 1';
const GRID_SIZE = 16;

const createTile = (index: number): TileData => ({
  id: `tile-${index}`,
  terrain: index % 5 === 0 ? 'solid' : 'dungeon',
  feature: index % 7 === 0 ? 'statue' : 'none',
  encounter: index % 3 === 0 ? 'random' : 'none',
  sideN: 'wall',
  sideS: 'wall',
  sideE: 'wall',
  sideW: 'wall',
  notes: '',
  connections: [],
});

const createEmptyMap = (name = DEFAULT_MAP_NAME): MapDocument => ({
  name,
  width: GRID_SIZE,
  height: GRID_SIZE,
  lastUpdated: new Date().toISOString(),
  tiles: Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => createTile(index)),
});

const terrainOptions: Array<{ value: Terrain; label: string }> = [
  { value: 'dungeon', label: 'Dungeon' },
  { value: 'path', label: 'Path' },
  { value: 'forest', label: 'Forest' },
  { value: 'solid', label: 'Solid' },
];

const featureOptions: Array<{ value: Feature; label: string }> = [
  { value: 'none', label: 'Nothing' },
  { value: 'statue', label: 'Statue' },
  { value: 'store', label: 'Store' },
  { value: 'temple', label: 'Temple / Healing' },
  { value: 'trap', label: 'Trap / Hazard' },
  { value: 'portal', label: 'Portal' },
  { value: 'stairs', label: 'Stairs' },
];

const encounterOptions: Array<{ value: Encounter; label: string }> = [
  { value: 'none', label: 'Never' },
  { value: 'random', label: 'Random' },
  { value: 'always', label: 'Always' },
];

const sideOptions: Array<{ value: SideState; label: string }> = [
  { value: 'wall', label: 'Wall' },
  { value: 'door', label: 'Door' },
  { value: 'gate', label: 'Gate' },
  { value: 'window', label: 'Window' },
  { value: 'secret', label: 'Secret' },
  { value: 'open', label: 'Open' },
];

const storageKey = 'dungeon-mapper-mm1-map';

export default function App() {
  const [mapDoc, setMapDoc] = useState<MapDocument>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved) as MapDocument;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    return createEmptyMap();
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [newConnection, setNewConnection] = useState({ toMap: '', coords: '0,0', side: 'N' as Connection['side'], note: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(mapDoc));
  }, [mapDoc]);

  const selectedTile = mapDoc.tiles[selectedIndex];

  const updateTile = (index: number, updates: Partial<TileData>) => {
    setMapDoc((current) => ({
      ...current,
      lastUpdated: new Date().toISOString(),
      tiles: current.tiles.map((tile, tileIndex) => (tileIndex === index ? { ...tile, ...updates } : tile)),
    }));
  };

  const addConnection = () => {
    if (!newConnection.toMap.trim()) return;

    updateTile(selectedIndex, {
      connections: [
        ...selectedTile.connections,
        {
          toMap: newConnection.toMap.trim(),
          coords: newConnection.coords.trim() || '0,0',
          side: newConnection.side,
          note: newConnection.note.trim() || 'linked map',
        },
      ],
    });

    setNewConnection({ toMap: '', coords: '0,0', side: 'N', note: '' });
  };

  const exportedBlob = useMemo(() => {
    const data = JSON.stringify(mapDoc, null, 2);
    return URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  }, [mapDoc]);

  const onImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as MapDocument;
      parsed.tiles = parsed.tiles?.length ? parsed.tiles : createEmptyMap(parsed.name).tiles;
      setMapDoc({ ...parsed, lastUpdated: new Date().toISOString() });
      setSelectedIndex(0);
    } catch {
      alert('That file is not a valid dungeon map JSON export.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <main className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">MM1 dungeon mapper</p>
          <h1>Retro map editor for old-school dungeon crawls</h1>
          <p className="lede">
            Track terrain, walls, doors, encounter hotspots, and cross-map links in a simple local tool that saves to your browser and exports to JSON.
          </p>
        </div>
        <div className="hero-actions">
          <button className="ghost" onClick={() => setMapDoc(createEmptyMap(mapDoc.name))}>Reset map</button>
          <button className="ghost" onClick={() => fileInputRef.current?.click()}>Import JSON</button>
          <a className="primary" href={exportedBlob} download={`${mapDoc.name.toLowerCase().replace(/\s+/g, '-') || 'map'}.json`}>
            Export JSON
          </a>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={onImport} hidden />
        </div>
      </header>

      <section className="grid-layout">
        <article className="panel map-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Map</p>
              <h2>{mapDoc.name}</h2>
            </div>
            <label className="field-inline">
              <span>Map name</span>
              <input
                value={mapDoc.name}
                onChange={(event) => setMapDoc((current) => ({ ...current, name: event.target.value, lastUpdated: new Date().toISOString() }))}
              />
            </label>
          </div>

          <div className="toolbar-row">
            <button className="chip" onClick={() => setMapDoc(createEmptyMap(mapDoc.name))}>New blank map</button>
            <span className="muted">{mapDoc.tiles.length} tiles • 16 × 16</span>
          </div>

          <div className="map-grid" role="grid" aria-label="Dungeon map grid">
            {mapDoc.tiles.map((tile, index) => (
              <button
                key={tile.id}
                type="button"
                className={`tile-btn ${selectedIndex === index ? 'selected' : ''} ${tile.terrain}`}
                onClick={() => setSelectedIndex(index)}
                title={`Tile ${index + 1}: ${tile.feature} / ${tile.encounter}`}
              >
                <span>{index + 1}</span>
                <small>{tile.feature === 'none' ? tile.terrain : tile.feature}</small>
              </button>
            ))}
          </div>
        </article>

        <aside className="panel inspector-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inspector</p>
              <h2>Selected tile {selectedIndex + 1}</h2>
            </div>
            <span className="badge">{selectedTile.terrain}</span>
          </div>

          <label className="field-stack">
            <span>Terrain</span>
            <select value={selectedTile.terrain} onChange={(event) => updateTile(selectedIndex, { terrain: event.target.value as Terrain })}>
              {terrainOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="field-stack">
            <span>Feature / marker</span>
            <select value={selectedTile.feature} onChange={(event) => updateTile(selectedIndex, { feature: event.target.value as Feature })}>
              {featureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="field-stack">
            <span>Encounter rule</span>
            <select value={selectedTile.encounter} onChange={(event) => updateTile(selectedIndex, { encounter: event.target.value as Encounter })}>
              {encounterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="field-stack">
            <span>Notes</span>
            <textarea
              rows={4}
              value={selectedTile.notes}
              onChange={(event) => updateTile(selectedIndex, { notes: event.target.value })}
              placeholder="Describe secret passage, trap, lore note, or room function"
            />
          </label>

          <div className="side-grid">
            {(['N', 'S', 'E', 'W'] as const).map((side) => (
              <label key={side} className="field-stack side-card">
                <span>Side {side}</span>
                <select
                  value={selectedTile[`side${side}` as keyof TileData] as SideState}
                  onChange={(event) => updateTile(selectedIndex, { [`side${side}`]: event.target.value } as Partial<TileData>)}
                >
                  {sideOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            ))}
          </div>

          <section className="mini-card">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Connections</p>
                <h3>Link to other maps</h3>
              </div>
              <span className="muted">{selectedTile.connections.length} links</span>
            </div>

            <label className="field-stack">
              <span>Target map</span>
              <input value={newConnection.toMap} onChange={(event) => setNewConnection((current) => ({ ...current, toMap: event.target.value }))} placeholder="Town 1 / Dungeon Level 2" />
            </label>

            <div className="two-col">
              <label className="field-stack">
                <span>Coords</span>
                <input value={newConnection.coords} onChange={(event) => setNewConnection((current) => ({ ...current, coords: event.target.value }))} placeholder="2,10" />
              </label>
              <label className="field-stack">
                <span>Side</span>
                <select value={newConnection.side} onChange={(event) => setNewConnection((current) => ({ ...current, side: event.target.value as Connection['side'] }))}>
                  {(['N', 'S', 'E', 'W'] as const).map((side) => <option key={side} value={side}>{side}</option>)}
                </select>
              </label>
            </div>

            <label className="field-stack">
              <span>Connection note</span>
              <input value={newConnection.note} onChange={(event) => setNewConnection((current) => ({ ...current, note: event.target.value }))} placeholder="stairwell, secret passage, portal" />
            </label>

            <button className="primary full" onClick={addConnection}>Add link from this tile</button>

            <ul className="connection-list">
              {selectedTile.connections.length === 0 && <li className="muted">No map connections yet.</li>}
              {selectedTile.connections.map((entry, index) => (
                <li key={`${entry.toMap}-${index}`}>
                  <strong>{entry.toMap}</strong>
                  <span>via {entry.side} at {entry.coords}</span>
                  <em>{entry.note}</em>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>

      <section className="bottom-grid">
        <article className="panel mini-card">
          <p className="eyebrow">Quick notes</p>
          <ul className="notes-list">
            <li>Local storage keeps your active map in this browser.</li>
            <li>Export to JSON to share files between computers.</li>
            <li>Mark always/random encounters directly on each tile.</li>
          </ul>
        </article>
        <article className="panel mini-card">
          <p className="eyebrow">Status</p>
          <p className="muted">Last updated: {new Date(mapDoc.lastUpdated).toLocaleString()}</p>
          <p className="muted">Current tile feature: {selectedTile.feature}</p>
          <p className="muted">Encounter setting: {selectedTile.encounter}</p>
        </article>
      </section>
    </main>
  );
}

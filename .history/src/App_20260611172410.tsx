import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, DungeonMap, Tile, TileType, EdgeType, ObjectType, EncounterType } from './types';
import { createInitialMap, createInitialTile } from './constants';
import { RetroGrid } from './components/RetroGrid';
import { Toolbar } from './components/Toolbar';
import { TileDetails } from './components/TileDetails';
import { MapList } from './components/MapList';
import { GlobalControls } from './components/GlobalControls';

const LOCAL_STORAGE_KEY = 'mm1_dungeon_mapper_data_v1';

// Initial default map setup
const createInitialProjectData = (): ProjectData => {
  const defaultMapId = 'town_middlegate';
  const defaultMap = createInitialMap(defaultMapId, 'Middlegate Town', 'path');
  
  // Custom setup for Middlegate: add some forest, town feel
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      // Create a surrounding forest wall
      if (x === 0 || x === 15 || y === 0 || y === 15) {
        defaultMap.grid[y][x].type = 'forest';
      }
    }
  }

  // Draw some basic structures in town center
  for (let x = 5; x <= 10; x++) {
    for (let y = 5; y <= 10; y++) {
      defaultMap.grid[y][x].type = 'dungeon'; // Cobble/dungeon flooring inside town
    }
  }

  // Place basic shops in the starting town as defaults
  defaultMap.grid[8][8].content = 'inn';
  defaultMap.grid[8][8].contentLabel = 'Inn of Middlegate';
  defaultMap.grid[7][6].content = 'store_weapon';
  defaultMap.grid[7][6].contentLabel = 'Turin Armory';
  defaultMap.grid[9][6].content = 'temple';
  defaultMap.grid[9][6].contentLabel = 'Temple of Yak';
  defaultMap.grid[7][10].content = 'guild';
  defaultMap.grid[7][10].contentLabel = 'Training Hall';

  return {
    projectName: 'Might & Magic 1 Maps',
    maps: {
      [defaultMapId]: defaultMap,
    },
    currentMapId: defaultMapId,
    crtEffect: true,
  };
};

export const App: React.FC = () => {
  const [project, setProject] = useState<ProjectData>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.maps && parsed.currentMapId) {
          return parsed as ProjectData;
        }
      } catch (err) {
        console.error('Failed to load saved map data from localStorage', err);
      }
    }
    return createInitialProjectData();
  });

  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>({ x: 8, y: 8 });
  const [activeTool, setActiveTool] = useState<{ type: 'select' | 'terrain' | 'wall' | 'object' | 'encounter'; value: string }>({
    type: 'select',
    value: 'none',
  });

  // Automatically save project data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const currentMap = project.maps[project.currentMapId] || Object.values(project.maps)[0];

  // Bidirectional wall/edge update helper
  const handleToggleEdge = (x: number, y: number, direction: 'n' | 's' | 'e' | 'w', overrideType?: EdgeType) => {
    setProject((prev) => {
      const targetMap = prev.maps[prev.currentMapId];
      if (!targetMap) return prev;

      // Copy the map grid
      const newGrid = targetMap.grid.map((row) => row.map((tile) => ({ ...tile, edges: { ...tile.edges } })));
      const tile = newGrid[y][x];

      // Determine what the new edge type should be
      const currentType = tile.edges[direction].type;
      let nextType: EdgeType = 'open';

      if (overrideType !== undefined) {
        nextType = overrideType;
      } else if (activeTool.type === 'wall') {
        const selectedWall = activeTool.value as EdgeType;
        nextType = currentType === selectedWall ? 'open' : selectedWall;
      } else {
        // Simple cycle for clicking without a brush
        const types: EdgeType[] = ['open', 'wall', 'door', 'secret', 'gate', 'window'];
        const idx = types.indexOf(currentType);
        nextType = types[(idx + 1) % types.length];
      }

      // 1. Update primary tile edge
      tile.edges[direction] = { type: nextType };

      // 2. Update adjacent tile edge to keep the map consistent
      let adjX = x;
      let adjY = y;
      let adjDir: 'n' | 's' | 'e' | 'w' = 'n';

      if (direction === 'n' && y < 15) {
        adjY = y + 1;
        adjDir = 's';
      } else if (direction === 's' && y > 0) {
        adjY = y - 1;
        adjDir = 'n';
      } else if (direction === 'e' && x < 15) {
        adjX = x + 1;
        adjDir = 'w';
      } else if (direction === 'w' && x > 0) {
        adjX = x - 1;
        adjDir = 'e';
      }

      // If neighbor exists inside 16x16 bounds, sync its edge
      if (adjX !== x || adjY !== y) {
        newGrid[adjY][adjX].edges[adjDir] = { type: nextType };
      }

      return {
        ...prev,
        maps: {
          ...prev.maps,
          [prev.currentMapId]: {
            ...targetMap,
            grid: newGrid,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Click-and-drag or click-to-paint terrain backgrounds
  const handlePaintCell = (x: number, y: number) => {
    if (activeTool.type === 'select') return;

    setProject((prev) => {
      const targetMap = prev.maps[prev.currentMapId];
      if (!targetMap) return prev;

      const newGrid = targetMap.grid.map((row) => row.map((tile) => ({ ...tile })));
      const tile = newGrid[y][x];

      if (activeTool.type === 'terrain') {
        tile.type = activeTool.value as TileType;
      } else if (activeTool.type === 'object') {
        tile.content = activeTool.value as ObjectType;
        if (activeTool.value === 'none') {
          tile.contentLabel = '';
          tile.connection = undefined;
        }
      } else if (activeTool.type === 'encounter') {
        tile.encounter = activeTool.value as EncounterType;
      }

      return {
        ...prev,
        maps: {
          ...prev.maps,
          [prev.currentMapId]: {
            ...targetMap,
            grid: newGrid,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Keyboard navigation & quick shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when the user is typing in forms/notes
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT')
      ) {
        return;
      }

      if (!selectedCell) return;

      const { x, y } = selectedCell;

      switch (e.key) {
        // Movement (Arrow Keys Only)
        case 'ArrowUp':
          e.preventDefault();
          setSelectedCell({ x, y: Math.min(15, y + 1) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedCell({ x, y: Math.max(0, y - 1) });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedCell({ x: Math.max(0, x - 1), y });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedCell({ x: Math.min(15, x + 1), y });
          break;

        // Wall Toggles (N, S, E, W)
        case 'n':
        case 'N':
          handleToggleEdge(x, y, 'n');
          break;
        case 's':
        case 'S':
          handleToggleEdge(x, y, 's');
          break;
        case 'e':
        case 'E':
          handleToggleEdge(x, y, 'e');
          break;
        case 'w':
        case 'W':
          handleToggleEdge(x, y, 'w');
          break;

        // Spacebar to paint terrain
        case ' ':
          e.preventDefault();
          handlePaintCell(x, y);
          break;

        // Escape to clear brush
        case 'Escape':
          setActiveTool({ type: 'select', value: 'none' });
          break;

        // Brush shortcuts 1 to 6
        case '1':
          setActiveTool({ type: 'terrain', value: 'unknown' });
          break;
        case '2':
          setActiveTool({ type: 'terrain', value: 'solid' });
          break;
        case '3':
          setActiveTool({ type: 'terrain', value: 'dungeon' });
          break;
        case '4':
          setActiveTool({ type: 'terrain', value: 'path' });
          break;
        case '5':
          setActiveTool({ type: 'terrain', value: 'forest' });
          break;
        case '6':
          setActiveTool({ type: 'terrain', value: 'water' });
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, activeTool]);

  // Update specific tile fields (from TileDetails sidebar)
  const handleUpdateTile = (updatedTile: Tile) => {
    setProject((prev) => {
      const targetMap = prev.maps[prev.currentMapId];
      if (!targetMap) return prev;

      const newGrid = targetMap.grid.map((row) => row.map((tile) => (tile.x === updatedTile.x && tile.y === updatedTile.y ? updatedTile : tile)));

      return {
        ...prev,
        maps: {
          ...prev.maps,
          [prev.currentMapId]: {
            ...targetMap,
            grid: newGrid,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Select another map
  const handleSelectMap = (mapId: string) => {
    setProject((prev) => ({
      ...prev,
      currentMapId: mapId,
    }));
    setSelectedCell({ x: 8, y: 8 });
  };

  // Create a brand new map
  const handleCreateMap = (name: string, defaultTerrain: TileType, addBorders: boolean) => {
    const id = `map_${Date.now()}`;
    const newMap = createInitialMap(id, name, defaultTerrain);
    
    // Wipe borders if addBorders is false
    if (!addBorders) {
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          newMap.grid[y][x].edges.n.type = 'open';
          newMap.grid[y][x].edges.s.type = 'open';
          newMap.grid[y][x].edges.e.type = 'open';
          newMap.grid[y][x].edges.w.type = 'open';
        }
      }
    }

    setProject((prev) => ({
      ...prev,
      maps: {
        ...prev.maps,
        [id]: newMap,
      },
      currentMapId: id,
    }));
    setSelectedCell({ x: 8, y: 8 });
  };

  // Delete an existing map
  const handleDeleteMap = (mapId: string) => {
    if (Object.keys(project.maps).length <= 1) return; // Cannot delete last map

    setProject((prev) => {
      const newMaps = { ...prev.maps };
      delete newMaps[mapId];
      
      // Select next available map if we deleted the current one
      const remainingMapIds = Object.keys(newMaps);
      const nextMapId = prev.currentMapId === mapId ? remainingMapIds[0] : prev.currentMapId;

      return {
        ...prev,
        maps: newMaps,
        currentMapId: nextMapId,
      };
    });
    setSelectedCell({ x: 8, y: 8 });
  };

  // Rename an existing map
  const handleRenameMap = (mapId: string, newName: string) => {
    setProject((prev) => {
      const map = prev.maps[mapId];
      if (!map) return prev;
      return {
        ...prev,
        maps: {
          ...prev.maps,
          [mapId]: {
            ...map,
            name: newName,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Set borders on all edges of current map
  const handleAddBorders = (mapId: string) => {
    setProject((prev) => {
      const map = prev.maps[mapId];
      if (!map) return prev;

      const newGrid = map.grid.map((row) => row.map((tile) => ({ ...tile, edges: { ...tile.edges } })));
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const tile = newGrid[y][x];
          if (y === 0) tile.edges.s.type = 'wall';
          if (y === 15) tile.edges.n.type = 'wall';
          if (x === 0) tile.edges.w.type = 'wall';
          if (x === 15) tile.edges.e.type = 'wall';
        }
      }

      return {
        ...prev,
        maps: {
          ...prev.maps,
          [mapId]: {
            ...map,
            grid: newGrid,
            updatedAt: Date.now(),
          },
        },
      };
    });
  };

  // Navigate selection immediately to another map & coordinate
  const handleNavigateTo = (mapId: string, x: number, y: number) => {
    setProject((prev) => ({
      ...prev,
      currentMapId: mapId,
    }));
    setSelectedCell({ x, y });
  };

  // Create a new map and link it bidirectionally with the current tile
  const handleCreateAndLinkMap = (mapName: string, defaultTerrain: TileType, tx: number, ty: number) => {
    if (!selectedCell) return;
    const { x: curX, y: curY } = selectedCell;

    const newMapId = `map_${Date.now()}`;
    const newMap = createInitialMap(newMapId, mapName, defaultTerrain);

    // Get current tile to identify its type (stairs up/down, portal)
    const currentTile = currentMap.grid[curY][curX];
    const currentContent = currentTile.content;

    // Determine opposite content for destination cell on the new map
    let destContent: ObjectType = 'stairs_up';
    if (currentContent === 'stairs_up') destContent = 'stairs_down';
    else if (currentContent === 'stairs_down') destContent = 'stairs_up';
    else if (currentContent === 'portal') destContent = 'portal';

    // Place destination POI and set destination connection back to here
    const destTile = newMap.grid[ty][tx];
    destTile.content = destContent;
    destTile.contentLabel = `Link to ${currentMap.name}`;
    destTile.connection = {
      targetMapId: currentMap.id,
      targetX: curX,
      targetY: curY,
    };

    setProject((prev) => {
      // Connect local tile to the new map
      const prevMap = prev.maps[prev.currentMapId];
      const newPrevGrid = prevMap.grid.map((row) => row.map((tile) => ({ ...tile })));
      newPrevGrid[curY][curX].connection = {
        targetMapId: newMapId,
        targetX: tx,
        targetY: ty,
      };

      return {
        ...prev,
        maps: {
          ...prev.maps,
          [prev.currentMapId]: {
            ...prevMap,
            grid: newPrevGrid,
            updatedAt: Date.now(),
          },
          [newMapId]: newMap,
        },
        currentMapId: newMapId,
      };
    });

    // Move selection cursor to the new map tile
    setSelectedCell({ x: tx, y: ty });
  };

  // Export JSON database
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON database
  const handleImport = (importedData: ProjectData) => {
    setProject(importedData);
    setSelectedCell({ x: 8, y: 8 });
  };

  // Reset database to starting town template
  const handleReset = () => {
    const fresh = createInitialProjectData();
    setProject(fresh);
    setSelectedCell({ x: 8, y: 8 });
  };

  const handleToggleCrt = () => {
    setProject((prev) => ({
      ...prev,
      crtEffect: !prev.crtEffect,
    }));
  };

  const selectedTile = selectedCell ? currentMap.grid[selectedCell.y][selectedCell.x] : null;

  const connectedMaps = useMemo(() => {
    type ConnectionSummary = {
      mapId: string;
      mapName: string;
      outbound: number;
      inbound: number;
    };

    const summaryByMapId = new Map<string, ConnectionSummary>();

    // Outbound links from current map to other maps
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const connection = currentMap.grid[y][x].connection;
        if (!connection) continue;
        if (connection.targetMapId === currentMap.id) continue;
        const target = project.maps[connection.targetMapId];
        if (!target) continue;

        const existing = summaryByMapId.get(target.id);
        if (existing) {
          existing.outbound += 1;
        } else {
          summaryByMapId.set(target.id, {
            mapId: target.id,
            mapName: target.name,
            outbound: 1,
            inbound: 0,
          });
        }
      }
    }

    // Inbound links from other maps that point at current map
    Object.values(project.maps).forEach((map) => {
      if (map.id === currentMap.id) return;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const connection = map.grid[y][x].connection;
          if (!connection || connection.targetMapId !== currentMap.id) continue;

          const existing = summaryByMapId.get(map.id);
          if (existing) {
            existing.inbound += 1;
          } else {
            summaryByMapId.set(map.id, {
              mapId: map.id,
              mapName: map.name,
              outbound: 0,
              inbound: 1,
            });
          }
        }
      }
    });

    return Array.from(summaryByMapId.values()).sort((a, b) => a.mapName.localeCompare(b.mapName));
  }, [currentMap, project.maps]);

  return (
    <div className={`crt-container`}>
      {project.crtEffect && <div className="crt-effect" />}
      {project.crtEffect && <div className="crt-flicker" />}

      {/* Header Dashboard */}
      <header className="app-header">
        <div className="app-title">⚔️ MM1 DUNGEON MAPPER</div>
        <GlobalControls
          crtEffect={project.crtEffect}
          onToggleCrt={handleToggleCrt}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleReset}
        />
      </header>

      {/* Main Workspace Layout */}
      <div className="app-layout">
        {/* Left Sidebar - Map Database list */}
        <aside className="sidebar">
          <div className="sidebar-section" style={{ borderBottom: '1px solid #222' }}>
            <div className="sidebar-title">🗺 Map Index</div>
          </div>
          <MapList
            maps={project.maps}
            currentMapId={project.currentMapId}
            onSelectMap={handleSelectMap}
            onCreateMap={handleCreateMap}
            onDeleteMap={handleDeleteMap}
            onRenameMap={handleRenameMap}
            onAddBorders={handleAddBorders}
          />

          <div className="sidebar-section connected-maps-section">
            <div className="sidebar-title">🔗 Connected Maps</div>
            <div className="connected-maps-subtitle">Auto-detected links for {currentMap.name}</div>

            <div className="connected-map-list">
              {connectedMaps.length === 0 ? (
                <div className="connected-map-empty">No direct map links yet. Create a portal or stairs connection to populate this list.</div>
              ) : (
                connectedMaps.map((item) => (
                  <button
                    key={item.mapId}
                    className="connected-map-item"
                    onClick={() => handleSelectMap(item.mapId)}
                    title="Open connected map"
                  >
                    <span className="connected-map-name">{item.mapName}</span>
                    <span className="connected-map-meta">↗ {item.outbound}  ↙ {item.inbound}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Center Canvas - 16x16 Grid */}
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 'min(72vh, 72vw)', marginBottom: '8px' }}>
            <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--ega-green)' }}>
              Map: {currentMap.name}
            </h2>
            <div style={{ fontSize: '1rem', color: '#888' }}>
              Mode: {activeTool.type === 'select' ? '🔍 Inspect' : `🖌 Painting ${activeTool.type}`}
            </div>
          </div>

          <RetroGrid
            grid={currentMap.grid}
            selectedCell={selectedCell}
            onSelectCell={(x, y) => {
              setSelectedCell({ x, y });
              setActiveTool({ type: 'select', value: 'none' });
            }}
            onPaintCell={handlePaintCell}
            onToggleEdge={handleToggleEdge}
            isPaintingMode={activeTool.type !== 'select'}
          />

          <div className="coord-display">
            CURSOR: ({selectedCell?.x ?? '?'}, {selectedCell?.y ?? '?'})
          </div>
        </main>

        {/* Right Sidebar - Painting Brushes & Tile Inspector */}
        <aside className="sidebar right">
          <div className="sidebar-section">
            <div className="sidebar-title">🎨 Brush Palette</div>
          </div>

          <div className="right-sidebar-scroll">
            <div className="right-sidebar-panel">
              <Toolbar
                activeTool={activeTool}
                onChangeTool={(type, value) => setActiveTool({ type, value })}
              />
            </div>

            <div className="right-sidebar-panel">
              <div className="sidebar-section" style={{ borderBottom: '1px solid #222' }}>
                <div className="sidebar-title">🔍 Cell Inspector</div>
              </div>
              <TileDetails
                tile={selectedTile}
                maps={project.maps}
                onUpdateTile={handleUpdateTile}
                onNavigateTo={handleNavigateTo}
                onCreateAndLinkMap={handleCreateAndLinkMap}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
export default App;

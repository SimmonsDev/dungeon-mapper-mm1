import React, { useState, useEffect } from 'react';
import { Tile, TileType, EdgeType, ObjectType } from '../types';
import { TILE_TYPES, OBJECT_TYPES, ENCOUNTER_TYPES } from '../constants';

interface RetroGridProps {
  grid: Tile[][];
  selectedCell: { x: number; y: number } | null;
  onSelectCell: (x: number, y: number) => void;
  onPaintCell: (x: number, y: number) => void;
  onToggleEdge: (x: number, y: number, direction: 'n' | 's' | 'e' | 'w', overrideType?: EdgeType) => void;
  isPaintingMode: boolean;
  activeWallType?: EdgeType;
  activeToolType: 'select' | 'terrain' | 'wall' | 'object' | 'encounter';
}

export const RetroGrid: React.FC<RetroGridProps> = ({
  grid,
  selectedCell,
  onSelectCell,
  onPaintCell,
  onToggleEdge,
  isPaintingMode,
  activeWallType,
  activeToolType,
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Set up mouse up listener on window to stop painting when dragging off-grid
  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleCellMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    if (e.button !== 0) return; // Only left-click
    setIsMouseDown(true);
    if (isPaintingMode) {
      onPaintCell(x, y);
    } else {
      onSelectCell(x, y);
    }
  };

  const handleCellMouseEnter = (x: number, y: number) => {
    if (isMouseDown && isPaintingMode) {
      onPaintCell(x, y);
    }
  };

  // Render rows from y = 15 down to y = 0 (bottom-left coordinate origin)
  const renderRows = () => {
    const rows = [];
    for (let y = 15; y >= 0; y--) {
      const rowCells = [];
      for (let x = 0; x < 16; x++) {
        const tile = grid[y][x];
        const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;
        const tileMeta = TILE_TYPES[tile.type];
        const objMeta = OBJECT_TYPES[tile.content];
        const encMeta = ENCOUNTER_TYPES[tile.encounter];

        rowCells.push(
          <div
            key={`${x}-${y}`}
            className={`grid-cell ${isSelected ? 'active-cell' : ''}`}
            style={{
              backgroundColor: tileMeta.color,
              // Add a slight tile texture pattern for solid rocks to make it look cool
              backgroundImage: tile.type === 'solid' 
                ? 'radial-gradient(circle, #444 10%, transparent 11%)' 
                : 'none',
              backgroundSize: tile.type === 'solid' ? '8px 8px' : 'auto',
            }}
            onMouseDown={(e) => handleCellMouseDown(e, x, y)}
            onMouseEnter={() => handleCellMouseEnter(x, y)}
          >
            {/* Edge walls */}
            {tile.edges.n.type !== 'open' && (
              <div className={`edge-n wall-${tile.edges.n.type}`} />
            )}
            {tile.edges.s.type !== 'open' && (
              <div className={`edge-s wall-${tile.edges.s.type}`} />
            )}
            {tile.edges.e.type !== 'open' && (
              <div className={`edge-e wall-${tile.edges.e.type}`} />
            )}
            {tile.edges.w.type !== 'open' && (
              <div className={`edge-w wall-${tile.edges.w.type}`} />
            )}

            {/* Click triggers for editing walls directly on the grid */}
            <div
              className="edge-trigger edge-trigger-n"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleEdge(x, y, 'n', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEdge(x, y, 'n', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              title="Toggle North Wall"
            />
            <div
              className="edge-trigger edge-trigger-s"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleEdge(x, y, 's', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEdge(x, y, 's', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              title="Toggle South Wall"
            />
            <div
              className="edge-trigger edge-trigger-e"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleEdge(x, y, 'e', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEdge(x, y, 'e', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              title="Toggle East Wall"
            />
            <div
              className="edge-trigger edge-trigger-w"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleEdge(x, y, 'w', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEdge(x, y, 'w', activeToolType === 'wall' ? activeWallType : undefined);
              }}
              title="Toggle West Wall"
            />

            {/* Render cell contents (Shop, Stairs, Portal etc.) */}
            {tile.content !== 'none' && (
              <span 
                style={{ 
                  color: objMeta.color, 
                  fontSize: '1.4rem', 
                  zIndex: 2,
                  textShadow: `0 0 4px ${objMeta.color}80`,
                  fontWeight: 'bold'
                }}
                title={`${objMeta.label}${tile.contentLabel ? `: ${tile.contentLabel}` : ''}`}
              >
                {objMeta.symbol}
              </span>
            )}

            {/* Render encounter badge if there's no main content or place it as overlay */}
            {tile.encounter !== 'none' && tile.content === 'none' && (
              <span 
                style={{ 
                  color: encMeta.color, 
                  fontSize: '1.2rem', 
                  zIndex: 2,
                  fontWeight: 'bold'
                }}
                title={encMeta.label}
              >
                {encMeta.symbol}
              </span>
            )}
            {tile.encounter !== 'none' && tile.content !== 'none' && (
              <span 
                style={{ 
                  position: 'absolute',
                  top: '2px',
                  right: '4px',
                  color: encMeta.color, 
                  fontSize: '0.75rem', 
                  zIndex: 3,
                  fontWeight: 'bold'
                }}
                title={encMeta.label}
              >
                {encMeta.symbol}
              </span>
            )}

            {/* Render a tiny marker for custom labels / notes if they exist */}
            {tile.notes && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '4px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 2px #fff',
                  zIndex: 3
                }}
                title="Contains Notes"
              />
            )}
            
            {/* Render a tiny portal linkage marker */}
            {tile.connection && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '4px',
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#9933ff',
                  boxShadow: '0 0 2px #9933ff',
                  zIndex: 3
                }}
                title={`Links to: ${tile.connection.targetMapId}`}
              />
            )}
          </div>
        );
      }
      rows.push(rowCells);
    }
    return rows;
  };

  return (
    <div className="grid-container">
      {renderRows().flatMap((row) => row)}
    </div>
  );
};

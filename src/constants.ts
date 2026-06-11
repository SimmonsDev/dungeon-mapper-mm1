import { Tile, DungeonMap, TileType, EdgeType, ObjectType, EncounterType } from './types';

export const TILE_TYPES: Record<TileType, { label: string; color: string; desc: string }> = {
  unknown: { label: 'Unknown', color: '#000000', desc: 'Unexplored territory' },
  solid: { label: 'Solid Rock', color: '#333333', desc: 'Solid impassable stone' },
  dungeon: { label: 'Dungeon Floor', color: '#1a1a1a', desc: 'Open corridor or room' },
  path: { label: 'Path / Road', color: '#594a3a', desc: 'Cobblestone or dirt road' },
  forest: { label: 'Forest / Woods', color: '#0b3d1b', desc: 'Thick trees and foliage' },
  water: { label: 'Water / Swamp', color: '#002b5c', desc: 'Deep water, river, or marsh' },
  mountain: { label: 'Mountain', color: '#4d4d4d', desc: 'High impassable peaks' },
};

export const EDGE_TYPES: Record<EdgeType, { label: string; color: string; style: string }> = {
  open: { label: 'Open', color: 'transparent', style: 'none' },
  wall: { label: 'Solid Wall', color: '#00ff66', style: 'solid' },
  door: { label: 'Door', color: '#ffcc00', style: 'double' },
  secret: { label: 'Secret Passage', color: '#ff00ff', style: 'dashed' },
  gate: { label: 'Gate', color: '#00ffff', style: 'dotted' },
  window: { label: 'Window', color: '#ff3366', style: 'solid' },
};

export const OBJECT_TYPES: Record<ObjectType, { label: string; symbol: string; color: string; desc: string }> = {
  none: { label: 'None', symbol: '', color: 'transparent', desc: 'Empty space' },
  stairs_up: { label: 'Stairs Up', symbol: '▲', color: '#ffffff', desc: 'Leads to upper level' },
  stairs_down: { label: 'Stairs Down', symbol: '▼', color: '#ffffff', desc: 'Leads to lower level' },
  portal: { label: 'Portal / Teleporter', symbol: '🌀', color: '#9933ff', desc: 'Warp to coordinates' },
  inn: { label: 'Inn / Tavern', symbol: '🍺', color: '#ffaa00', desc: 'Rest and save game' },
  tavern: { label: 'Tavern', symbol: '🍷', color: '#ff6600', desc: 'Gather rumors' },
  temple: { label: 'Temple / Healer', symbol: '✚', color: '#ff3333', desc: 'Healing and resurrection' },
  guild: { label: 'Training Guild', symbol: '⚔', color: '#00ccff', desc: 'Level up and train' },
  store_weapon: { label: 'Weapon/Armor Shop', symbol: '🛡', color: '#a0a0a0', desc: 'Buy combat gear' },
  store_magic: { label: 'Magic Shop', symbol: '🔮', color: '#d166ff', desc: 'Buy spells and scrolls' },
  store_alchemy: { label: 'Alchemist / Items', symbol: '🧪', color: '#33cc33', desc: 'Buy potions and herbs' },
  statue: { label: 'Statue / Fountain', symbol: '⛲', color: '#e6e6e6', desc: 'Interactions or buffs' },
  trap: { label: 'Trap / Pit', symbol: '☠', color: '#ff3333', desc: 'Damage or status effects' },
  custom: { label: 'Custom Label', symbol: '?', color: '#ffffff', desc: 'User custom point of interest' },
};

export const ENCOUNTER_TYPES: Record<EncounterType, { label: string; color: string; symbol: string }> = {
  none: { label: 'Safe (No Encounters)', color: 'transparent', symbol: '' },
  random: { label: 'Random Encounters', color: '#ffaa00', symbol: '⚡' },
  always: { label: 'Fixed Hotspot (Always)', color: '#ff0033', symbol: '☠' },
};

export function createInitialTile(x: number, y: number, type: TileType): Tile {
  return {
    x,
    y,
    type,
    edges: {
      n: { type: 'open' },
      s: { type: 'open' },
      e: { type: 'open' },
      w: { type: 'open' },
    },
    content: 'none',
    encounter: 'none',
    notes: '',
  };
}

export function createInitialMap(id: string, name: string, defaultTileType: TileType): DungeonMap {
  const grid: Tile[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < 16; x++) {
      row.push(createInitialTile(x, y, defaultTileType));
    }
    grid.push(row);
  }

  // Optionally set boundary outer walls if the map type is solid/dungeon
  if (defaultTileType === 'dungeon' || defaultTileType === 'solid') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const tile = grid[y][x];
        if (y === 0) tile.edges.s.type = 'wall';
        if (y === 15) tile.edges.n.type = 'wall';
        if (x === 0) tile.edges.w.type = 'wall';
        if (x === 15) tile.edges.e.type = 'wall';
      }
    }
  }

  return {
    id,
    name,
    defaultTileType,
    grid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

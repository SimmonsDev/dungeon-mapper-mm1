export type TileType = 'unknown' | 'solid' | 'dungeon' | 'path' | 'forest' | 'water' | 'mountain';

export type EdgeType = 'open' | 'wall' | 'door' | 'secret' | 'gate' | 'window';

export interface TileEdge {
  type: EdgeType;
}

export type ObjectType =
  | 'none'
  | 'stairs_up'
  | 'stairs_down'
  | 'portal'
  | 'inn'
  | 'tavern'
  | 'temple'
  | 'guild'
  | 'store_weapon'
  | 'store_magic'
  | 'store_alchemy'
  | 'statue'
  | 'trap'
  | 'custom';

export type EncounterType = 'none' | 'random' | 'always';

export interface MapConnection {
  targetMapId: string;
  targetX: number;
  targetY: number;
}

export interface Tile {
  x: number; // 0 to 15
  y: number; // 0 to 15 (bottom-left is 0,0)
  type: TileType;
  edges: {
    n: TileEdge;
    s: TileEdge;
    e: TileEdge;
    w: TileEdge;
  };
  content: ObjectType;
  contentLabel?: string;
  encounter: EncounterType;
  notes?: string;
  connection?: MapConnection;
}

export interface DungeonMap {
  id: string;
  name: string;
  defaultTileType: TileType;
  grid: Tile[][]; // 16x16 grid, accessed as grid[y][x] where y is 0-15 and x is 0-15
  createdAt: number;
  updatedAt: number;
}

export interface ProjectData {
  projectName: string;
  maps: Record<string, DungeonMap>;
  currentMapId: string;
  crtEffect: boolean;
}

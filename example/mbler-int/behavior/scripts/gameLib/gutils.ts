import { Dimension } from '@minecraft/server';

export interface Vector3Type {
  dis: string | null;
  x: number;
  y: number;
  z: number;
}

export class Vector3 {
  x: number;
  y: number;
  z: number;
  dis: string | null;

  constructor(x1?: number, y1?: number, z1?: number, dimension?: string | Dimension) {
    this.x = x1 || 0;
    this.y = y1 || 0;
    this.z = z1 || 0;
    this.dis = typeof dimension === "object" ? (dimension.id || "overworld") : (
      [
        'overworld',
        'nether',
        'the_end'
      ].includes(dimension as string) ? dimension as string : null
    );
  }

  // Convert to Minecraft Vector3 compatible object
  toMinecraftVector3(): { x: number; y: number; z: number } {
    return { x: this.x, y: this.y, z: this.z };
  }
}
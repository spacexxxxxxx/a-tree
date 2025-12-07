import { Vector3, Euler } from 'three';

export enum ShapeType {
  SPHERE = 'SPHERE',
  CUBE = 'CUBE'
}

export interface TreeItemData {
  id: number;
  position: Vector3;
  rotation: Euler;
  scale: number;
  type: ShapeType;
  color: string;
}

export const PALETTE = {
  GOLD: '#FFD700',
  DEEP_GOLD: '#DAA520',
  RED: '#C41E3A',
  GREEN: '#165B33',
  DARK_GREEN: '#0F3B20',
};
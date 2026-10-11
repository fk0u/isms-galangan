/**
 * Data meja MOCK untuk denah demo. Koordinat dalam unit viewBox SVG (320 x 400),
 * x/y = titik tengah meja.
 */

export type TableStatus = "available" | "occupied";
export type TableShape = "round" | "square" | "long";

export interface DiningTable {
  id: string;
  label: string;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  status: TableStatus;
}

export const FLOOR_VIEWBOX = { width: 320, height: 400 } as const;

export const DINING_TABLES: readonly DiningTable[] = [
  { id: "t1", label: "1", seats: 2, shape: "round", x: 62, y: 72, status: "available" },
  { id: "t2", label: "2", seats: 2, shape: "round", x: 160, y: 72, status: "occupied" },
  { id: "t3", label: "3", seats: 2, shape: "round", x: 258, y: 72, status: "available" },
  { id: "t4", label: "4", seats: 4, shape: "square", x: 70, y: 178, status: "available" },
  { id: "t5", label: "5", seats: 4, shape: "square", x: 168, y: 178, status: "occupied" },
  { id: "t6", label: "6", seats: 6, shape: "long", x: 262, y: 222, status: "available" },
  { id: "t7", label: "7", seats: 4, shape: "square", x: 70, y: 278, status: "occupied" },
  { id: "t8", label: "8", seats: 4, shape: "square", x: 168, y: 278, status: "available" },
];

export const TABLE_BY_ID: ReadonlyMap<string, DiningTable> = new Map(DINING_TABLES.map((t) => [t.id, t]));

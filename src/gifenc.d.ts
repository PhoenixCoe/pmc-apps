declare module 'gifenc' {
  export function GIFEncoder(): { writeFrame(index: Uint8Array, w: number, h: number, o?: { palette?: number[][]; delay?: number; repeat?: number; transparent?: boolean; transparentIndex?: number }): void; finish(): void; bytes(): Uint8Array };
  export function quantize(data: Uint8ClampedArray | Uint8Array, max: number, o?: { format?: string }): number[][];
  export function applyPalette(data: Uint8ClampedArray | Uint8Array, palette: number[][], format?: string): Uint8Array;
}

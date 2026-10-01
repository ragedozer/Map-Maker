const pad = (n: number) => String(n).padStart(2, '0');

export function exportFilename(selectedCount: number, ext: 'png' | 'svg', now = new Date()): string {
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` + `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `us-map_${selectedCount}-selected_${stamp}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function svgBlob(svg: string): Blob {
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n`, svg], { type: 'image/svg+xml' });
}

export interface PngReport {
  width: number;
  height: number;
  /** Alpha of the four corner pixels (0 = fully transparent). */
  cornerAlpha: number[];
  /** Share of pixels with alpha 0. */
  transparentShare: number;
  bytes: number;
}

/**
 * Rasterize the exact SVG markup used by the preview. The SVG carries
 * width/height = size, so the browser renders the vectors natively at that
 * resolution (no bitmap upscaling). The canvas is never filled: pixels the
 * map doesn't touch stay at alpha 0.
 */
export async function rasterizePng(svg: string, size: number): Promise<{ blob: Blob; report: PngReport }> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    img.src = url;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    const data = ctx.getImageData(0, 0, size, size).data;
    const alphaAt = (x: number, y: number) => data[(y * size + x) * 4 + 3];
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++;

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
    );

    return {
      blob,
      report: {
        width: canvas.width,
        height: canvas.height,
        cornerAlpha: [alphaAt(0, 0), alphaAt(size - 1, 0), alphaAt(0, size - 1), alphaAt(size - 1, size - 1)],
        transparentShare: transparent / (size * size),
        bytes: blob.size,
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

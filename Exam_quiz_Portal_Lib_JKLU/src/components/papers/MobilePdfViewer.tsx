import React, { useEffect, useRef, useState } from 'react';
import Loader from '@/components/ui/Loader';

interface MobilePdfViewerProps {
  url: string;
  token?: string;
  onBlobUrl?: (blobUrl: string | null) => void;
}

const MobilePdfViewer: React.FC<MobilePdfViewerProps> = ({ url, token, onBlobUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let createdBlobUrl: string | null = null;

    const renderPdf = async () => {
      setLoading(true);
      setError(false);
      setPageCount(0);
      onBlobUrl?.(null);

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '') || '';
        const res = await fetch(url, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load PDF');
        const data = await res.arrayBuffer();
        if (cancelled) return;

        createdBlobUrl = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        onBlobUrl?.(createdBlobUrl);

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument({
          data,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/standard_fonts/',
          wasmUrl: '/wasm/',
          iccUrl: '/iccs/',
        }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const container = containerRef.current;
        if (!container) return;

        const targetWidth = Math.max(280, container.clientWidth - 16);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break;
          const page = await pdf.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.className = 'mx-auto rounded-lg shadow-sm bg-white block mb-3';

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error('MobilePdfViewer error:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      controller.abort();
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
      onBlobUrl?.(null);
    };
  }, [url, token]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center text-xs text-gray-500 dark:text-gray-400">
        Preview unavailable on this device. Tap Open Full PDF or Download below.
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 w-full flex flex-col">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <Loader />
          {pageCount > 0 && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              Rendering {pageCount} page{pageCount > 1 ? 's' : ''}...
            </p>
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 w-full overflow-y-auto p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
      />
    </div>
  );
};

export default MobilePdfViewer;

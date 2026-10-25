function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Resilient dynamic module loader with automatic retry on transient connection drops
 */
async function loadDynamicModule<T>(loader: () => Promise<T>, moduleName: string): Promise<T> {
  try {
    return await loader();
  } catch (err: unknown) {
    const errorObj = err as { message?: string; name?: string };
    if (errorObj?.message?.includes('Failed to fetch') || errorObj?.name === 'TypeError') {
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return await loader();
      } catch {
        throw new Error(
          `Could not load the ${moduleName} parser. Please refresh your browser (F5) to sync with the server.`
        );
      }
    }
    throw err;
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt' || extension === 'md' || extension === 'csv') {
    return await file.text();
  }

  if (extension === 'ppt') {
    throw new Error('Older binary .ppt format is not supported. Please save your presentation as .pptx or .pdf.');
  }

  // Lazy-load PDF parser on demand to keep initial bundle size lean
  if (extension === 'pdf') {
    const pdfjs = await loadDynamicModule(() => import('pdfjs-dist'), 'PDF');

    // Configure local worker without requiring unpkg CDN
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    loadingTask.onPassword = () => {
      throw new Error('This PDF is password-protected. Please unlock or decrypt the file before uploading.');
    };

    try {
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .join(' ');
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      }

      if (!fullText.trim()) {
        throw new Error('Could not extract text from this PDF. It may contain scanned images without text.');
      }

      return fullText.trim();
    } finally {
      loadingTask.destroy();
    }
  }

  // Lazy-load JSZip on demand
  if (extension === 'pptx') {
    const JSZipModule = await loadDynamicModule(() => import('jszip'), 'PowerPoint');
    const JSZip = JSZipModule.default || JSZipModule;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    let fullText = '';

    // Attempt to read presentation relationship ordering (proper slide order)
    let orderedSlideFiles: string[] = [];
    try {
      const presXml = await zip.files['ppt/presentation.xml']?.async('text');
      const relsXml = await zip.files['ppt/_rels/presentation.xml.rels']?.async('text');
      if (presXml && relsXml) {
        const relMap = new Map<string, string>();
        const relMatches = relsXml.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g);
        for (const match of relMatches) {
          const id = match[1];
          let target = match[2];
          if (!target.startsWith('ppt/')) {
            target = target.startsWith('/') ? target.slice(1) : `ppt/${target.replace(/^slides\//, 'slides/')}`;
            if (!target.startsWith('ppt/slides/')) {
              target = `ppt/slides/${target.split('/').pop()}`;
            }
          }
          relMap.set(id, target);
        }

        const sldMatches = presXml.matchAll(/<p:sldId[^>]+r:id="([^"]+)"/g);
        for (const match of sldMatches) {
          const rId = match[1];
          const filename = relMap.get(rId);
          if (filename && zip.files[filename]) {
            orderedSlideFiles.push(filename);
          }
        }
      }
    } catch {
      // Fallback below
    }

    // Fallback: sort slides numerically slide1.xml, slide2.xml...
    if (orderedSlideFiles.length === 0) {
      orderedSlideFiles = Object.keys(zip.files).filter((filename) =>
        filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
      );
      orderedSlideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        return numA - numB;
      });
    }

    for (let i = 0; i < orderedSlideFiles.length; i++) {
      const filename = orderedSlideFiles[i];
      const xmlString = await zip.files[filename].async('text');
      // Extract text content inside PowerPoint text elements <a:t>...</a:t>
      const matches = xmlString.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
      if (matches) {
        const slideText = matches
          .map((m) => decodeXmlEntities(m.replace(/<[^>]+>/g, '').trim()))
          .filter(Boolean)
          .join(' ');
        if (slideText) {
          fullText += `--- Slide ${i + 1} ---\n${slideText}\n\n`;
        }
      }
    }

    if (!fullText.trim()) {
      throw new Error('Could not extract text from this PowerPoint file.');
    }

    return fullText.trim();
  }

  throw new Error(`Unsupported file type: .${extension}. Please select a .pdf, .pptx, or .txt file.`);
}

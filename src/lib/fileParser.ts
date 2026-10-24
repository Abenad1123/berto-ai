function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
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
    const pdfjs = await import('pdfjs-dist');

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
  }

  // Lazy-load JSZip on demand
  if (extension === 'pptx') {
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default || JSZipModule;
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    let fullText = '';

    const slideFiles = Object.keys(zip.files).filter((filename) =>
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );

    // Sort slides numerically: slide1.xml, slide2.xml...
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return numA - numB;
    });

    for (let i = 0; i < slideFiles.length; i++) {
      const filename = slideFiles[i];
      const xmlString = await zip.files[filename].async('text');
      // Extract text content inside PowerPoint text elements <a:t>...</a:t>
      const matches = xmlString.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
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

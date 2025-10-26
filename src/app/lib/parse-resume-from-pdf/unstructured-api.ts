/**
 * Unstructured API integration for parsing documents
 * 
 * The Unstructured API can parse various document formats including PDF, DOCX, DOC, etc.
 * and extract structured data from them.
 */

export interface UnstructuredElement {
  type: string;
  text: string;
  metadata?: {
    filename?: string;
    page_number?: number;
    coordinates?: {
      points: number[][];
      system: string;
      layout_width: number;
      layout_height: number;
    };
  };
}

/**
 * Parse a document using the Unstructured API
 * 
 * @param file - The file to parse (can be PDF, DOCX, DOC, etc.)
 * @returns Array of parsed elements from the document
 */
export const parseDocumentWithUnstructured = async (
  file: File
): Promise<UnstructuredElement[]> => {
  const apiKey = process.env.NEXT_PUBLIC_UNSTRUCTURED_API_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_UNSTRUCTURED_API_URL || 
    'https://api.unstructured.io/general/v0/general';

  if (!apiKey) {
    throw new Error(
      'Unstructured API key not configured. Please set NEXT_PUBLIC_UNSTRUCTURED_API_KEY environment variable.'
    );
  }

  const formData = new FormData();
  formData.append('files', file);
  
  // Strategy options: hi_res, fast, auto
  // hi_res provides better quality but is slower
  formData.append('strategy', 'hi_res');
  
  // Enable coordinate extraction for positioning information
  formData.append('coordinates', 'true');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'unstructured-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Unstructured API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const elements: UnstructuredElement[] = await response.json();
    return elements;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse document with Unstructured API: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Convert Unstructured API elements to TextItems format
 * This maintains compatibility with the existing parsing pipeline
 */
export const convertUnstructuredToTextItems = (
  elements: UnstructuredElement[]
): any[] => {
  // Group elements by page and maintain vertical ordering
  const textItems = elements
    .filter(element => element.text && element.text.trim())
    .map((element, index) => {
      const metadata = element.metadata || {};
      const coordinates = metadata.coordinates;
      
      // Extract position information if available
      // Unstructured uses top-left origin, we need to adapt to PDF.js format
      let x = 0;
      let y = 0;
      let width = 100;
      let height = 12;

      if (coordinates && coordinates.points && coordinates.points.length > 0) {
        // Get bounding box from points
        const points = coordinates.points;
        const xs = points.map(p => p[0]);
        const ys = points.map(p => p[1]);
        
        x = Math.min(...xs);
        const maxX = Math.max(...xs);
        width = maxX - x;
        
        // Unstructured uses top-left origin, need to convert to bottom-left for consistency
        const maxY = Math.max(...ys);
        const minY = Math.min(...ys);
        height = maxY - minY;
        
        // Convert to bottom-left origin (assuming page height of 792 for standard letter)
        const pageHeight = coordinates.layout_height || 792;
        y = pageHeight - maxY;
      }

      // Determine if this is end of line
      // We'll mark it as EOL if it's the last element or if the next element
      // is on a different line (different y position)
      const hasEOL = true; // Default to true, will be refined during line grouping

      return {
        text: element.text,
        x,
        y,
        width,
        height,
        fontName: 'UnknownFont', // Unstructured doesn't provide font info
        hasEOL,
      };
    });

  return textItems;
};

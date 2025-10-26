import type { TextItem, TextItems } from "lib/parse-resume-from-pdf/types";
import { parseDocumentWithUnstructured, convertUnstructuredToTextItems } from "./unstructured-api";

/**
 * Read and parse a document file using Unstructured API
 * 
 * This replaces the PDF.js-based parsing to support multiple document formats
 * including PDF, DOCX, DOC, and other formats supported by Unstructured API.
 *
 * @example
 * const onFileChange = async (e) => {
 *     const file = e.target.files[0];
 *     const textItems = await readDocument(file);
 * }
 */
export const readDocument = async (file: File): Promise<TextItems> => {
  try {
    // Parse document using Unstructured API
    const elements = await parseDocumentWithUnstructured(file);
    
    // Convert to TextItems format for compatibility with existing pipeline
    let textItems = convertUnstructuredToTextItems(elements);

    // Filter out empty space textItem noise
    const isEmptySpace = (textItem: TextItem) =>
      !textItem.hasEOL && textItem.text.trim() === "";
    textItems = textItems.filter((textItem) => !isEmptySpace(textItem));

    return textItems;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
    throw error;
  }
};

// Maintain backward compatibility with the old API that used fileUrl
// This converts a file URL back to a File object
export const readPdf = async (fileUrl: string): Promise<TextItems> => {
  try {
    // Fetch the file from the URL
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // Determine the file extension from the URL
    const filename = fileUrl.split('/').pop() || 'document';
    const file = new File([blob], filename, { type: blob.type });
    
    return readDocument(file);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read PDF from URL: ${error.message}`);
    }
    throw error;
  }
};

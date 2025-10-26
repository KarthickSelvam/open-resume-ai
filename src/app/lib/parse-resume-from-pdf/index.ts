import { readPdf, readDocument } from "lib/parse-resume-from-pdf/read-document";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";

/**
 * Resume parser util that parses a resume from a document file using Unstructured API
 *
 * Supports multiple formats: PDF, DOCX, DOC, and other formats supported by Unstructured API
 * Note: The parser algorithm works best on single column resume in English language
 */
export const parseResumeFromPdf = async (fileUrl: string) => {
  // Step 1. Read a document file into text items to prepare for processing
  const textItems = await readPdf(fileUrl);

  // Step 2. Group text items into lines
  const lines = groupTextItemsIntoLines(textItems);

  // Step 3. Group lines into sections
  const sections = groupLinesIntoSections(lines);

  // Step 4. Extract resume from sections
  const resume = extractResumeFromSections(sections);

  return resume;
};

/**
 * Parse a resume directly from a File object
 * 
 * @param file - The file to parse (PDF, DOCX, DOC, etc.)
 */
export const parseResumeFromFile = async (file: File) => {
  // Step 1. Read document file into text items to prepare for processing
  const textItems = await readDocument(file);

  // Step 2. Group text items into lines
  const lines = groupTextItemsIntoLines(textItems);

  // Step 3. Group lines into sections
  const sections = groupLinesIntoSections(lines);

  // Step 4. Extract resume from sections
  const resume = extractResumeFromSections(sections);

  return resume;
};

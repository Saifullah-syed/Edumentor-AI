import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromFile({ buffer, mimetype, originalname }) {
  const extension = originalname.split('.').pop()?.toLowerCase();

  try {
    // 1. PDF (Standard industry resume format)
    if (mimetype === 'application/pdf' || extension === 'pdf') {
      const data = await pdfParse(buffer);
      return data.text || '';
    }

    throw new Error(`Unsupported file type: ${mimetype || extension}. Resumes must be uploaded in PDF (.pdf) format.`);
  } catch (err) {
    console.error('[Resume Parser Error]', err);
    throw new Error(`Failed to parse resume text: ${err.message}`);
  }
}

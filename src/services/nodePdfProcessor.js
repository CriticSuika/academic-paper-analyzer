const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

class NodePdfProcessor {
  async processPDF(pdfFilePath) {
    try {
      const dataBuffer = await fs.readFile(pdfFilePath);
      const data = await pdfParse(dataBuffer);
      
      return {
        success: true,
        text: data.text,
        metadata: {
          page_count: data.numpages,
          info: data.info || {},
          version: data.version || ''
        },
        file_path: pdfFilePath
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        file_path: pdfFilePath
      };
    }
  }
}

module.exports = NodePdfProcessor;
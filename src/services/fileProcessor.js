const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const NodePdfProcessor = require('./nodePdfProcessor');

class FileProcessor {
  constructor() {
    this.pythonScriptsPath = path.join(__dirname, '../../python-scripts');
    this.nodePdfProcessor = new NodePdfProcessor();
  }

  async processPDF(pdfFilePath) {
    // Try Node.js PDF parser first
    try {
      console.log('Trying Node.js PDF parser...');
      const result = await this.nodePdfProcessor.processPDF(pdfFilePath);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn('Node.js PDF parser failed:', error.message);
    }

    // Fallback to PyPDF2 Python script
    try {
      console.log('Trying PyPDF2 Python parser...');
      const options = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: this.pythonScriptsPath,
        args: [pdfFilePath]
      };

      return new Promise((resolve, reject) => {
        PythonShell.run('pdf_parser_pypdf2.py', options, (err, results) => {
          if (err) {
            console.error('PyPDF2 processing error:', err);
            // Try original pdfplumber script as last resort
            this.tryOriginalPdfParser(pdfFilePath, resolve, reject);
            return;
          }

          try {
            const result = JSON.parse(results[0]);
            resolve(result);
          } catch (parseError) {
            // Try original pdfplumber script as last resort
            this.tryOriginalPdfParser(pdfFilePath, resolve, reject);
          }
        });
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  tryOriginalPdfParser(pdfFilePath, resolve, reject) {
    console.log('Trying original pdfplumber parser as last resort...');
    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: this.pythonScriptsPath,
      args: [pdfFilePath]
    };

    PythonShell.run('pdf_parser.py', options, (err, results) => {
      if (err) {
        reject(new Error(`All PDF parsing methods failed. Last error: ${err.message}`));
        return;
      }

      try {
        const result = JSON.parse(results[0]);
        resolve(result);
      } catch (parseError) {
        reject(new Error(`All PDF parsing methods failed. Parse error: ${parseError.message}`));
      }
    });
  }


  async processFiles(pdfPath) {
    try {
      console.log(`Processing PDF file: ${pdfPath}`);
      
      const pdfResult = await this.processPDF(pdfPath);

      if (!pdfResult.success) {
        throw new Error(`PDF processing failed: ${pdfResult.error}`);
      }

      return {
        pdf: pdfResult,
        text: pdfResult.text
      };
    } catch (error) {
      console.error('Error processing PDF file:', error);
      throw error;
    }
  }

  validateFilePath(pdfPath) {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
  }
}

module.exports = FileProcessor;
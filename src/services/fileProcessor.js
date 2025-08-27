const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

class FileProcessor {
  constructor() {
    this.pythonScriptsPath = path.join(__dirname, '../../python-scripts');
  }

  async processPDF(pdfFilePath) {
    try {
      const scriptPath = path.join(this.pythonScriptsPath, 'pdf_parser.py');
      
      const options = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: this.pythonScriptsPath,
        args: [pdfFilePath]
      };

      return new Promise((resolve, reject) => {
        PythonShell.run('pdf_parser.py', options, (err, results) => {
          if (err) {
            console.error('PDF processing error:', err);
            reject(err);
            return;
          }

          try {
            const result = JSON.parse(results[0]);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse PDF processing result: ${parseError.message}`));
          }
        });
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
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
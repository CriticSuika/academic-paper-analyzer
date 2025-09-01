import PyPDF2
import sys
import json
import os
from typing import Dict, Any

def extract_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extract text content from PDF file using PyPDF2
    """
    try:
        text_content = ""
        metadata = {}
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Extract metadata
            if pdf_reader.metadata:
                metadata = {
                    'title': pdf_reader.metadata.get('/Title', ''),
                    'author': pdf_reader.metadata.get('/Author', ''),
                    'subject': pdf_reader.metadata.get('/Subject', ''),
                    'creator': pdf_reader.metadata.get('/Creator', ''),
                    'producer': pdf_reader.metadata.get('/Producer', ''),
                    'creation_date': str(pdf_reader.metadata.get('/CreationDate', '')),
                    'modification_date': str(pdf_reader.metadata.get('/ModDate', '')),
                    'page_count': len(pdf_reader.pages)
                }
            else:
                metadata = {'page_count': len(pdf_reader.pages)}
            
            # Extract text from all pages
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text_content += f"\n--- Page {page_num} ---\n"
                    text_content += page_text
                    
        return {
            'success': True,
            'text': text_content.strip(),
            'metadata': metadata,
            'file_path': pdf_path
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'file_path': pdf_path
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python pdf_parser_pypdf2.py <pdf_file_path>'
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({
            'success': False,
            'error': f'File not found: {pdf_path}'
        }))
        sys.exit(1)
    
    result = extract_text_from_pdf(pdf_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
import pdfplumber
import sys
import json
import os
from typing import Dict, Any

def extract_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extract text content from PDF file using pdfplumber
    """
    try:
        text_content = ""
        metadata = {}
        
        with pdfplumber.open(pdf_path) as pdf:
            # Extract metadata
            metadata = {
                'title': pdf.metadata.get('Title', ''),
                'author': pdf.metadata.get('Author', ''),
                'subject': pdf.metadata.get('Subject', ''),
                'creator': pdf.metadata.get('Creator', ''),
                'producer': pdf.metadata.get('Producer', ''),
                'creation_date': str(pdf.metadata.get('CreationDate', '')),
                'modification_date': str(pdf.metadata.get('ModDate', '')),
                'page_count': len(pdf.pages)
            }
            
            # Extract text from all pages
            for page_num, page in enumerate(pdf.pages, 1):
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
            'error': 'Usage: python pdf_parser.py <pdf_file_path>'
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
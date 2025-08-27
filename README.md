# Academic Paper Analyzer

An AI-augmented system for automatically processing and analyzing academic papers uploaded to Google Drive, with structured storage in Notion and intelligent analysis via ChatGPT.

## 🎯 Features

- **Automated File Detection**: Google Apps Script monitors Drive for new paper uploads
- **Intelligent Processing**: PDF parsing with text extraction
- **AI Analysis**: ChatGPT integration for summaries, keywords, and field classification
- **Structured Storage**: Notion database with comprehensive paper metadata
- **Feedback System**: User ratings and revision tracking
- **Notifications**: Email and Slack notifications for processing completion/errors
- **Make.com Integration**: Automated workflow orchestration

## 📁 Project Structure

```
academic-paper-analyzer/
├── src/
│   ├── services/           # Core business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # Express middleware
│   └── server.js          # Main server file
├── python-scripts/        # PDF processing scripts
├── google-apps-script/    # Drive monitoring script
├── make-workflows/        # Make.com automation templates
└── package.json
```

## 🚀 Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
NOTION_API_KEY=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here

# Google Drive
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
GOOGLE_DRIVE_FOLDER_ID=your_academic_papers_folder_id_here

# Server
PORT=3000
NODE_ENV=development

# Notifications (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 2. Install Dependencies

```bash
# Node.js dependencies
npm install

# Python dependencies for file processing
cd python-scripts
pip install -r requirements.txt
cd ..
```

### 3. Notion Database Setup

Create a Notion database with these properties:
- **Paper Name** (Title)
- **Link to Files** (URL)
- **Abstract** (Text)
- **Keywords** (Multi-select)
- **Field of Study** (Select)
- **Feedback Rating** (Number)
- **Needs Revision** (Checkbox)
- **Last Updated** (Date)

### 4. Google Apps Script Deployment

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy code from `google-apps-script/DriveMonitor.js`
4. Update configuration constants
5. Run `installTrigger()` function once

### 5. Make.com Workflow Setup

1. Import `make-workflows/AcademicPaperProcessor.json`
2. Configure Google Drive and HTTP connections
3. Update webhook URL and server endpoint
4. Test the workflow

### 6. Start the Server

```bash
npm start
# or for development
npm run dev
```

## 📝 API Endpoints

### Analysis
- `GET /api/analysis/papers` - Get all papers
- `GET /api/analysis/papers/:pageId` - Get specific paper
- `POST /api/analysis/reanalyze/:pageId` - Reanalyze paper
- `GET /api/analysis/stats` - Get analysis statistics

### Feedback
- `POST /api/feedback/submit` - Submit user feedback
- `GET /api/feedback/stats` - Get feedback statistics
- `GET /api/feedback/pending` - Get papers pending feedback
- `GET /api/feedback/needs-revision` - Get papers needing revision

### Webhooks
- `POST /webhook/drive-change` - Handle Drive change notifications
- `POST /webhook/feedback` - Handle feedback submissions

## 🔄 Workflow Overview

1. **Upload**: User uploads PDF to `/AcademicPapers/{PaperName}/`
2. **Detection**: Google Apps Script detects new folder
3. **Automation**: Make.com downloads files and triggers processing
4. **Processing**: Server processes files with Python scripts
5. **Analysis**: ChatGPT analyzes content and generates metadata
6. **Storage**: Results saved to Notion database
7. **Notification**: Success/error notifications sent

## 🛠️ Troubleshooting

### Common Issues

1. **Python Processing Errors**
   - Ensure Python dependencies are installed
   - Check file permissions and paths
   - Verify PDF files are not corrupted

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check rate limits and quotas
   - Ensure sufficient credits

3. **Notion Integration Issues**
   - Verify integration token permissions
   - Check database ID is correct
   - Ensure database properties match expected schema

4. **Google Drive Access**
   - Verify OAuth credentials
   - Check folder permissions
   - Ensure Google Apps Script has necessary permissions

### Logging

Check server logs for detailed error information:
```bash
npm start 2>&1 | tee server.log
```

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Feedback statistics: `GET /api/feedback/stats`
- Analysis statistics: `GET /api/analysis/stats`

## 🔧 Development

### Testing File Processing

```bash
# Test PDF processing
python python-scripts/pdf_parser.py /path/to/paper.pdf
```

### Manual Paper Processing

Use the analysis API endpoints to manually process papers or test specific components.

## 📜 License

This project implements the core academic paper analysis system as specified, processing PDF files only and excluding optional components like Supabase, Pinecone, and Grobid integration.
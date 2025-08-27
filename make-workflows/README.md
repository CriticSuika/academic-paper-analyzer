# Make.com Workflow Setup

## Academic Paper Processor Workflow

This workflow automates the processing of academic papers uploaded to Google Drive.

### Workflow Steps:

1. **Webhook Receiver** - Receives notifications from Google Apps Script
2. **Download PDF** - Downloads the paper PDF from Google Drive
3. **HTTP Request** - Sends data to our Node.js server for processing
4. **Set Variables** - Stores processing status and response
5. **Condition Router** - Checks if processing was successful (status 202)
6. **Success Path**: Wait 5 minutes then send success notification to Slack
7. **Failure Path**: Send error notification to Slack immediately

### Setup Instructions:

1. Import the `AcademicPaperProcessor.json` file into Make.com
2. Update the following placeholders:
   - `YOUR_WEBHOOK_ID_HERE` - Create a webhook in Make.com and use its ID
   - `YOUR_NODE_SERVER_URL` - Replace with your Node.js server URL
   - Configure Google Drive connection
   - Configure Slack connection (optional)

### Required Connections:

- **Google Drive**: Full access to your Google Drive
- **HTTP**: For making requests to your Node.js server
- **Slack**: For notifications (optional)

### Testing:

1. Upload a folder to `/AcademicPapers/` with a PDF file
2. The Google Apps Script should trigger the webhook
3. Make.com will process the files and send them to your server
4. Check Slack for success/failure notifications

### Error Handling:

- The workflow includes error handling for failed processing
- Failed attempts will be logged and reported via Slack
- You can manually retry failed scenarios from the Make.com interface
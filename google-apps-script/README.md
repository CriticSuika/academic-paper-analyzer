# Google Apps Script Setup

## Installation Steps

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Replace the default code with the contents of `DriveMonitor.js`
4. Update the configuration constants:
   - `WEBHOOK_URL`: Your Make.com webhook URL
   - `ACADEMIC_PAPERS_FOLDER_ID`: The ID of your AcademicPapers folder in Google Drive

## Required Permissions

The script needs the following permissions:
- Google Drive API access
- External HTTP requests (for webhooks)

## Setup Process

1. Run the `installTrigger()` function once to set up the monitoring
2. The script will check for new folders every 5 minutes
3. When a new folder with both PDF and PPTX files is detected, it sends a webhook to Make.com

## Testing

- Use `resetProcessedFolders()` to clear the processed folder records for testing
- Check the execution log for debugging information
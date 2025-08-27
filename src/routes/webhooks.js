const express = require('express');
const router = express.Router();
const FileProcessor = require('../services/fileProcessor');
const OpenAIService = require('../services/openaiService');
const NotionService = require('../services/notionService');
const NotificationService = require('../services/notificationService');

router.post('/drive-change', async (req, res) => {
  try {
    console.log('Received webhook from Google Drive:', req.body);
    
    const { folder, files } = req.body;
    
    if (!folder || !files || !files.pdf) {
      return res.status(400).json({
        error: 'Missing required data: folder and PDF file are required'
      });
    }

    const paperName = folder.name;
    const driveUrl = folder.url;

    console.log(`Processing paper: ${paperName}`);
    
    res.status(202).json({
      message: 'Processing started',
      paperName: paperName,
      status: 'accepted'
    });

    await processNewPaper({
      name: paperName,
      driveUrl: driveUrl,
      pdfFile: files.pdf
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { pageId, rating, needsRevision, comments } = req.body;
    
    if (!pageId || rating === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: pageId and rating are required'
      });
    }

    const notionService = new NotionService();
    await notionService.updateFeedback(pageId, rating, needsRevision, comments);
    
    res.json({
      message: 'Feedback updated successfully',
      pageId: pageId
    });
    
  } catch (error) {
    console.error('Feedback update error:', error);
    res.status(500).json({
      error: 'Failed to update feedback',
      message: error.message
    });
  }
});

async function processNewPaper(paperData) {
  try {
    const fileProcessor = new FileProcessor();
    const openaiService = new OpenAIService();
    const notionService = new NotionService();
    const notificationService = new NotificationService();

    console.log(`Step 1: Processing PDF file for ${paperData.name}`);
    
    const tempPdfPath = `/tmp/paper_${Date.now()}.pdf`;

    const processedFiles = await fileProcessor.processFiles(tempPdfPath);
    
    console.log(`Step 2: Analyzing content with OpenAI`);
    const analysis = await openaiService.analyzePaper(processedFiles.text);

    console.log(`Step 3: Updating Notion database`);
    const existingEntry = await notionService.findExistingEntry(paperData.name);
    
    const notionData = {
      name: paperData.name,
      driveUrl: paperData.driveUrl,
      analysis: analysis
    };

    let notionResponse;
    if (existingEntry) {
      notionResponse = await notionService.updatePaperEntry(existingEntry.id, notionData);
    } else {
      notionResponse = await notionService.createPaperEntry(notionData);
    }

    console.log(`Step 4: Sending completion notification`);
    await notificationService.sendCompletionNotification({
      paperName: paperData.name,
      driveUrl: paperData.driveUrl,
      notionUrl: `https://notion.so/${notionResponse.id}`,
      analysis: analysis
    });

    console.log(`✅ Successfully processed paper: ${paperData.name}`);
    
  } catch (error) {
    console.error(`❌ Error processing paper ${paperData.name}:`, error);
    
    try {
      const notificationService = new NotificationService();
      await notificationService.sendErrorNotification({
        paperName: paperData.name,
        error: error.message
      });
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
    
    throw error;
  }
}

module.exports = router;
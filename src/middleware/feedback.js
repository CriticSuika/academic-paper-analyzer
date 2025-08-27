const NotionService = require('../services/notionService');

const validateFeedback = (req, res, next) => {
  const { pageId, rating, needsRevision } = req.body;
  
  if (!pageId) {
    return res.status(400).json({
      error: 'Missing required field: pageId'
    });
  }
  
  if (rating !== undefined && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
    return res.status(400).json({
      error: 'Rating must be an integer between 1 and 5'
    });
  }
  
  if (needsRevision !== undefined && typeof needsRevision !== 'boolean') {
    return res.status(400).json({
      error: 'needsRevision must be a boolean value'
    });
  }
  
  next();
};

const logFeedback = (req, res, next) => {
  const { pageId, rating, needsRevision, comments } = req.body;
  
  console.log(`Feedback received for page ${pageId}:`, {
    rating,
    needsRevision,
    hasComments: !!comments,
    timestamp: new Date().toISOString()
  });
  
  next();
};

const checkPageExists = async (req, res, next) => {
  try {
    const { pageId } = req.body;
    const notionService = new NotionService();
    
    const page = await notionService.notion.pages.retrieve({
      page_id: pageId
    });
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found'
      });
    }
    
    req.page = page;
    next();
  } catch (error) {
    console.error('Error checking page existence:', error);
    
    if (error.code === 'object_not_found') {
      return res.status(404).json({
        error: 'Page not found in Notion database'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to validate page existence'
    });
  }
};

module.exports = {
  validateFeedback,
  logFeedback,
  checkPageExists
};
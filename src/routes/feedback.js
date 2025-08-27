const express = require('express');
const router = express.Router();
const NotionService = require('../services/notionService');
const { validateFeedback, logFeedback, checkPageExists } = require('../middleware/feedback');

router.post('/submit', validateFeedback, logFeedback, checkPageExists, async (req, res) => {
  try {
    const { pageId, rating, needsRevision, comments } = req.body;
    
    const notionService = new NotionService();
    const result = await notionService.updateFeedback(pageId, rating, needsRevision, comments);
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      pageId: pageId,
      updatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      message: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const notionService = new NotionService();
    const papers = await notionService.getAllPapers();
    
    const ratedPapers = papers.filter(p => p.rating !== null);
    const needsRevisionPapers = papers.filter(p => p.needsRevision);
    
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    ratedPapers.forEach(paper => {
      if (paper.rating) {
        ratingDistribution[paper.rating]++;
      }
    });
    
    const averageRating = ratedPapers.length > 0 
      ? ratedPapers.reduce((sum, p) => sum + p.rating, 0) / ratedPapers.length 
      : 0;
    
    const stats = {
      totalPapers: papers.length,
      ratedPapers: ratedPapers.length,
      unratedPapers: papers.length - ratedPapers.length,
      needsRevision: needsRevisionPapers.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution: ratingDistribution,
      satisfactionRate: ratedPapers.length > 0 
        ? Math.round((ratedPapers.filter(p => p.rating >= 4).length / ratedPapers.length) * 100) 
        : 0
    };
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback statistics'
    });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const notionService = new NotionService();
    const papers = await notionService.getAllPapers();
    
    const pendingFeedback = papers.filter(paper => 
      paper.rating === null && !paper.needsRevision
    );
    
    res.json({
      success: true,
      count: pendingFeedback.length,
      papers: pendingFeedback.map(paper => ({
        id: paper.id,
        name: paper.name,
        field: paper.field,
        lastUpdated: paper.lastUpdated,
        driveUrl: paper.driveUrl
      }))
    });
    
  } catch (error) {
    console.error('Error fetching pending feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch papers pending feedback'
    });
  }
});

router.get('/needs-revision', async (req, res) => {
  try {
    const notionService = new NotionService();
    const papers = await notionService.getAllPapers();
    
    const needsRevision = papers.filter(paper => paper.needsRevision);
    
    res.json({
      success: true,
      count: needsRevision.length,
      papers: needsRevision.map(paper => ({
        id: paper.id,
        name: paper.name,
        field: paper.field,
        rating: paper.rating,
        lastUpdated: paper.lastUpdated,
        driveUrl: paper.driveUrl
      }))
    });
    
  } catch (error) {
    console.error('Error fetching papers needing revision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch papers needing revision'
    });
  }
});

router.post('/batch-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        error: 'Updates must be an array of feedback objects'
      });
    }
    
    const notionService = new NotionService();
    const results = [];
    
    for (const update of updates) {
      try {
        await notionService.updateFeedback(
          update.pageId, 
          update.rating, 
          update.needsRevision, 
          update.comments
        );
        results.push({ pageId: update.pageId, success: true });
      } catch (error) {
        results.push({ 
          pageId: update.pageId, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Batch update completed: ${successCount}/${updates.length} successful`,
      results: results
    });
    
  } catch (error) {
    console.error('Error in batch update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch update'
    });
  }
});

module.exports = router;
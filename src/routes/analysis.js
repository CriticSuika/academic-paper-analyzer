const express = require('express');
const router = express.Router();
const NotionService = require('../services/notionService');
const OpenAIService = require('../services/openaiService');

router.get('/papers', async (req, res) => {
  try {
    const notionService = new NotionService();
    const papers = await notionService.getAllPapers();
    
    res.json({
      success: true,
      count: papers.length,
      papers: papers
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/papers/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const notionService = new NotionService();
    
    const response = await notionService.notion.pages.retrieve({
      page_id: pageId
    });
    
    const paperData = notionService.extractPageData(response);
    
    res.json({
      success: true,
      paper: paperData
    });
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/reanalyze/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required for reanalysis'
      });
    }
    
    const openaiService = new OpenAIService();
    const notionService = new NotionService();
    
    const analysis = await openaiService.analyzePaper(text);
    
    const updatedData = {
      analysis: analysis,
      needsRevision: false
    };
    
    await notionService.updatePaperEntry(pageId, updatedData);
    
    res.json({
      success: true,
      message: 'Paper reanalyzed successfully',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Error reanalyzing paper:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/keywords/generate', async (req, res) => {
  try {
    const { text, existingKeywords = [] } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }
    
    const openaiService = new OpenAIService();
    const keywords = await openaiService.generateKeywords(text, existingKeywords);
    
    res.json({
      success: true,
      keywords: keywords
    });
    
  } catch (error) {
    console.error('Error generating keywords:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/field/classify', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }
    
    const openaiService = new OpenAIService();
    const field = await openaiService.classifyField(text);
    
    res.json({
      success: true,
      field: field
    });
    
  } catch (error) {
    console.error('Error classifying field:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const notionService = new NotionService();
    const papers = await notionService.getAllPapers();
    
    const stats = {
      totalPapers: papers.length,
      needsRevision: papers.filter(p => p.needsRevision).length,
      averageRating: papers.reduce((sum, p) => sum + (p.rating || 0), 0) / papers.length,
      fieldDistribution: {},
      recentlyUpdated: papers.filter(p => {
        const lastUpdated = new Date(p.lastUpdated);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastUpdated > weekAgo;
      }).length
    };
    
    papers.forEach(paper => {
      const field = paper.field || 'Unknown';
      stats.fieldDistribution[field] = (stats.fieldDistribution[field] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
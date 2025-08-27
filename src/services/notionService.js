const { Client } = require('@notionhq/client');

class NotionService {
  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });
    this.databaseId = process.env.NOTION_DATABASE_ID;
  }

  async createPaperEntry(paperData) {
    try {
      const properties = this.buildNotionProperties(paperData);
      
      const response = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: properties
      });

      console.log(`Created Notion entry for paper: ${paperData.name}`);
      return response;
    } catch (error) {
      console.error('Error creating Notion entry:', error);
      throw error;
    }
  }

  async updatePaperEntry(pageId, paperData) {
    try {
      const properties = this.buildNotionProperties(paperData);
      
      const response = await this.notion.pages.update({
        page_id: pageId,
        properties: properties
      });

      console.log(`Updated Notion entry for paper: ${paperData.name}`);
      return response;
    } catch (error) {
      console.error('Error updating Notion entry:', error);
      throw error;
    }
  }

  async findExistingEntry(paperName) {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Paper Name',
          title: {
            equals: paperName
          }
        }
      });

      return response.results.length > 0 ? response.results[0] : null;
    } catch (error) {
      console.error('Error finding existing entry:', error);
      return null;
    }
  }

  buildNotionProperties(paperData) {
    const now = new Date().toISOString();
    
    const properties = {
      'Paper Name': {
        title: [
          {
            text: {
              content: paperData.name || 'Untitled Paper'
            }
          }
        ]
      },
      'Link to Files': {
        url: paperData.driveUrl || null
      },
      'Abstract': {
        rich_text: [
          {
            text: {
              content: (paperData.analysis?.summary || '').substring(0, 2000)
            }
          }
        ]
      },
      'Last Updated': {
        date: {
          start: now
        }
      }
    };

    if (paperData.analysis?.keywords) {
      properties['Keywords'] = {
        multi_select: paperData.analysis.keywords.map(keyword => ({
          name: keyword.substring(0, 100)
        }))
      };
    }

    if (paperData.analysis?.field) {
      properties['Field of Study'] = {
        select: {
          name: paperData.analysis.field.substring(0, 100)
        }
      };
    }

    if (paperData.feedbackRating !== undefined) {
      properties['Feedback Rating'] = {
        number: paperData.feedbackRating
      };
    }

    if (paperData.needsRevision !== undefined) {
      properties['Needs Revision'] = {
        checkbox: paperData.needsRevision
      };
    }

    return properties;
  }

  async updateFeedback(pageId, rating, needsRevision, comments) {
    try {
      const properties = {
        'Feedback Rating': {
          number: rating
        },
        'Needs Revision': {
          checkbox: needsRevision
        },
        'Last Updated': {
          date: {
            start: new Date().toISOString()
          }
        }
      };

      if (comments) {
        properties['Comments'] = {
          rich_text: [
            {
              text: {
                content: comments.substring(0, 2000)
              }
            }
          ]
        };
      }

      const response = await this.notion.pages.update({
        page_id: pageId,
        properties: properties
      });

      return response;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  async getAllPapers() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        sorts: [
          {
            property: 'Last Updated',
            direction: 'descending'
          }
        ]
      });

      return response.results.map(page => this.extractPageData(page));
    } catch (error) {
      console.error('Error fetching all papers:', error);
      throw error;
    }
  }

  extractPageData(page) {
    const properties = page.properties;
    
    return {
      id: page.id,
      name: properties['Paper Name']?.title?.[0]?.text?.content || 'Untitled',
      driveUrl: properties['Link to Files']?.url || '',
      abstract: properties['Abstract']?.rich_text?.[0]?.text?.content || '',
      keywords: properties['Keywords']?.multi_select?.map(tag => tag.name) || [],
      field: properties['Field of Study']?.select?.name || '',
      rating: properties['Feedback Rating']?.number || null,
      needsRevision: properties['Needs Revision']?.checkbox || false,
      lastUpdated: properties['Last Updated']?.date?.start || ''
    };
  }

  async createDatabase() {
    try {
      const response = await this.notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: process.env.NOTION_PARENT_PAGE_ID
        },
        title: [
          {
            type: 'text',
            text: {
              content: 'Academic Paper Library'
            }
          }
        ],
        properties: {
          'Paper Name': {
            title: {}
          },
          'Link to Files': {
            url: {}
          },
          'Abstract': {
            rich_text: {}
          },
          'Keywords': {
            multi_select: {
              options: []
            }
          },
          'Field of Study': {
            select: {
              options: [
                { name: 'Computer Science', color: 'blue' },
                { name: 'Biology', color: 'green' },
                { name: 'Physics', color: 'red' },
                { name: 'Chemistry', color: 'yellow' },
                { name: 'Mathematics', color: 'purple' },
                { name: 'Engineering', color: 'orange' },
                { name: 'Medicine', color: 'pink' },
                { name: 'Psychology', color: 'brown' },
                { name: 'Economics', color: 'gray' },
                { name: 'Other', color: 'default' }
              ]
            }
          },
          'Feedback Rating': {
            number: {
              format: 'number'
            }
          },
          'Needs Revision': {
            checkbox: {}
          },
          'Last Updated': {
            date: {}
          }
        }
      });

      console.log('Created Notion database:', response.id);
      return response;
    } catch (error) {
      console.error('Error creating Notion database:', error);
      throw error;
    }
  }
}

module.exports = NotionService;
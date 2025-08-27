const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzePaper(paperText) {
    try {
      const prompt = this.buildAnalysisPrompt(paperText);
      
      const completion = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert academic paper analyzer. Analyze the provided paper and return a structured JSON response with the requested information."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', response);
        return this.fallbackParsing(response);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to analyze paper: ${error.message}`);
    }
  }

  buildAnalysisPrompt(paperText) {
    return `Please analyze the following academic paper. Return your response in JSON format with the following structure:

{
  "summary": "A 2-3 sentence summary of the key ideas and contributions",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "field": "Primary academic field (e.g., Computer Science, Biology, Physics, etc.)",
  "methodology": "Brief description of the methodology used",
  "keyFindings": "Main findings or results",
  "significance": "Why this work is significant or noteworthy"
}

PAPER CONTENT:
${paperText}

Please ensure your response is valid JSON and contains all the required fields. Focus on accuracy and conciseness.`;
  }

  fallbackParsing(response) {
    const fallbackResult = {
      summary: "Analysis completed but structured parsing failed",
      keywords: ["paper", "research", "academic"],
      field: "Unknown",
      methodology: "Not extracted",
      keyFindings: "Not extracted",
      significance: "Not extracted",
      rawResponse: response
    };

    try {
      const lines = response.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('summary') || line.toLowerCase().includes('abstract')) {
          const match = line.match(/[:\-]\s*(.+)/);
          if (match) fallbackResult.summary = match[1].trim();
        }
        if (line.toLowerCase().includes('field')) {
          const match = line.match(/[:\-]\s*(.+)/);
          if (match) fallbackResult.field = match[1].trim();
        }
      }
    } catch (error) {
      console.error('Fallback parsing also failed:', error);
    }

    return fallbackResult;
  }

  async generateKeywords(text, existingKeywords = []) {
    try {
      const prompt = `Extract 5-10 relevant academic keywords from the following text. 
      Return only the keywords as a JSON array.
      Focus on technical terms, methodologies, and key concepts.
      
      Existing keywords to consider: ${existingKeywords.join(', ')}
      
      Text: ${text.substring(0, 2000)}`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting academic keywords. Return only a JSON array of keywords."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      });

      const response = completion.choices[0].message.content.trim();
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        const keywords = response
          .split(/[,\n]/)
          .map(k => k.replace(/["\[\]]/g, '').trim())
          .filter(k => k.length > 0)
          .slice(0, 8);
        
        return keywords;
      }
    } catch (error) {
      console.error('Keyword generation error:', error);
      return existingKeywords.length > 0 ? existingKeywords : ['research', 'academic', 'study'];
    }
  }

  async classifyField(text) {
    try {
      const prompt = `Classify the academic field of this paper. Choose from these categories:
      - Computer Science
      - Biology
      - Physics
      - Chemistry
      - Mathematics
      - Engineering
      - Medicine
      - Psychology
      - Economics
      - Other
      
      Return only the field name.
      
      Text: ${text.substring(0, 1000)}`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at classifying academic papers by field."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Field classification error:', error);
      return 'Other';
    }
  }
}

module.exports = OpenAIService;
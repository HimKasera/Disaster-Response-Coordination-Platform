import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CacheManager } from '../config/supabase.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// POST /disasters/:id/verify-image - Verify image authenticity
router.post('/:id/verify-image', async (req, res, next) => {
  try {
    const { id: disasterId } = req.params;
    const { image_url, description } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const cacheKey = `image_verify_${Buffer.from(image_url).toString('base64')}`;
    let cachedResult = await CacheManager.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      // Prepare the image data
      const imageData = {
        inlineData: {
          data: await fetchImageAsBase64(image_url),
          mimeType: 'image/jpeg'
        }
      };
      
      const prompt = `Analyze this image for signs of disaster-related content and potential manipulation. 
      
      Please evaluate:
      1. Is this image authentic or potentially manipulated/deepfaked?
      2. Does it show evidence of a disaster (flooding, fire, earthquake damage, etc.)?
      3. Are there any inconsistencies in lighting, shadows, or digital artifacts?
      4. Rate the authenticity on a scale of 1-10 (10 being completely authentic)
      
      Context: ${description || 'No additional context provided'}
      
      Respond in JSON format with: 
      {
        "authentic": boolean,
        "confidence": number (0-1),
        "disaster_evidence": boolean,
        "disaster_type": string or null,
        "manipulation_signs": string[],
        "authenticity_score": number (1-10),
        "analysis": string
      }`;
      
      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const analysisText = response.text();
      
      // Parse JSON response
      let verification;
      try {
        verification = JSON.parse(analysisText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        verification = {
          authentic: false,
          confidence: 0.5,
          disaster_evidence: false,
          disaster_type: null,
          manipulation_signs: ['Unable to parse AI response'],
          authenticity_score: 5,
          analysis: analysisText
        };
      }
      
      const verificationResult = {
        image_url,
        disaster_id: disasterId,
        verification,
        verified_at: new Date().toISOString(),
        verified_by: 'gemini-ai'
      };
      
      // Cache the result
      await CacheManager.set(cacheKey, verificationResult, 1440); // Cache for 24 hours
      
      console.log(`Image verification completed for disaster ${disasterId}: ${verification.authentic ? 'AUTHENTIC' : 'SUSPICIOUS'}`);
      
      res.json(verificationResult);
      
    } catch (aiError) {
      console.error('Gemini AI verification error:', aiError);
      
      // Fallback verification result
      const fallbackResult = {
        image_url,
        disaster_id: disasterId,
        verification: {
          authentic: null,
          confidence: 0,
          disaster_evidence: null,
          disaster_type: null,
          manipulation_signs: ['AI verification unavailable'],
          authenticity_score: null,
          analysis: 'Unable to analyze image due to AI service error'
        },
        verified_at: new Date().toISOString(),
        verified_by: 'fallback',
        error: 'AI verification service unavailable'
      };
      
      res.json(fallbackResult);
    }
  } catch (error) {
    next(error);
  }
});

// Helper function to fetch image as base64 (simplified for demo)
async function fetchImageAsBase64(imageUrl) {
  // In a real implementation, you would fetch the image and convert to base64
  // For this demo, we'll return a placeholder
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

export default router;
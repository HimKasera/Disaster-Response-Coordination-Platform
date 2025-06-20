import express from 'express';
import { CacheManager } from '../config/supabase.js';

const router = express.Router();

// GET /disasters/:id/social-media - Get social media reports
router.get('/:id/social-media', async (req, res, next) => {
  try {
    const { id: disasterId } = req.params;
    const { keywords, limit = 10 } = req.query;
    
    const cacheKey = `social_media_${disasterId}_${keywords || 'all'}`;
    let cachedData = await CacheManager.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Mock social media data for demonstration
    const mockSocialMediaData = await getMockSocialMediaData(disasterId, keywords, limit);
    
    // In a real application, you would call the actual Twitter API, Bluesky, etc.
    // const realData = await getTwitterData(keywords) || await getBlueskyData(keywords);
    
    await CacheManager.set(cacheKey, mockSocialMediaData, 15); // Cache for 15 minutes
    
    // Emit real-time update
    req.io.to(`disaster_${disasterId}`).emit('social_media_updated', {
      disaster_id: disasterId,
      reports: mockSocialMediaData.reports
    });
    
    console.log(`Social media reports fetched for disaster ${disasterId}: ${mockSocialMediaData.reports.length} reports`);
    
    res.json(mockSocialMediaData);
  } catch (error) {
    next(error);
  }
});

async function getMockSocialMediaData(disasterId, keywords, limit) {
  // Mock data simulating social media reports
  const mockReports = [
    {
      id: '1',
      platform: 'twitter',
      username: 'citizen1',
      content: '#floodrelief Need food and water in Lower East Side Manhattan. Family of 4 trapped on 3rd floor.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      urgency: 'high',
      location: 'Lower East Side, Manhattan',
      verified: false,
      engagement: { likes: 45, retweets: 23, replies: 12 }
    },
    {
      id: '2',
      platform: 'twitter',
      username: 'relief_worker',
      content: 'Setting up temporary shelter at Brooklyn Community Center. Can accommodate 50 families. #disasterrelief',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      urgency: 'medium',
      location: 'Brooklyn, NYC',
      verified: true,
      engagement: { likes: 78, retweets: 56, replies: 8 }
    },
    {
      id: '3',
      platform: 'bluesky',
      username: 'emergency_nyc',
      content: 'URGENT: Road closures on FDR Drive due to flooding. Seek alternate routes. Emergency vehicles only.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      urgency: 'high',
      location: 'FDR Drive, NYC',
      verified: true,
      engagement: { likes: 234, retweets: 189, replies: 45 }
    },
    {
      id: '4',
      platform: 'twitter',
      username: 'volunteer_help',
      content: 'Volunteers needed at Red Cross station. Bring boats if possible. Contact @redcross_nyc #volunteer',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      urgency: 'medium',
      location: 'Manhattan, NYC',
      verified: false,
      engagement: { likes: 156, retweets: 89, replies: 34 }
    },
    {
      id: '5',
      platform: 'twitter',
      username: 'sos_help',
      content: 'SOS! Elderly couple stuck in basement apartment. Water rising fast. Address: 45 Delancey St. HELP!',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      urgency: 'critical',
      location: '45 Delancey St, NYC',
      verified: false,
      engagement: { likes: 267, retweets: 445, replies: 78 }
    }
  ];
  
  // Filter by keywords if provided
  let filteredReports = mockReports;
  if (keywords) {
    const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
    filteredReports = mockReports.filter(report => 
      keywordArray.some(keyword => 
        report.content.toLowerCase().includes(keyword) ||
        report.location.toLowerCase().includes(keyword)
      )
    );
  }
  
  // Apply limit
  filteredReports = filteredReports.slice(0, parseInt(limit));
  
  return {
    disaster_id: disasterId,
    reports: filteredReports,
    summary: {
      total: filteredReports.length,
      critical: filteredReports.filter(r => r.urgency === 'critical').length,
      high: filteredReports.filter(r => r.urgency === 'high').length,
      medium: filteredReports.filter(r => r.urgency === 'medium').length,
      verified: filteredReports.filter(r => r.verified).length
    },
    last_updated: new Date().toISOString()
  };
}

// Mock Twitter API function (for future implementation)
async function getTwitterData(keywords) {
  // This would implement actual Twitter API calls
  // For now, returning null to use mock data
  return null;
}

// Mock Bluesky API function (for future implementation)
async function getBlueskyData(keywords) {
  // This would implement actual Bluesky API calls
  // For now, returning null to use mock data
  return null;
}

export default router;
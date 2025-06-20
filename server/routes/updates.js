import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CacheManager } from '../config/supabase.js';

const router = express.Router();

// GET /disasters/:id/official-updates - Get official updates
router.get('/:id/official-updates', async (req, res, next) => {
  try {
    const { id: disasterId } = req.params;
    const { source = 'all' } = req.query;
    
    const cacheKey = `official_updates_${disasterId}_${source}`;
    let cachedData = await CacheManager.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const updates = [];
    
    // Fetch from multiple official sources
    if (source === 'all' || source === 'fema') {
      const femaUpdates = await scrapeFEMAUpdates();
      updates.push(...femaUpdates);
    }
    
    if (source === 'all' || source === 'redcross') {
      const redCrossUpdates = await scrapeRedCrossUpdates();
      updates.push(...redCrossUpdates);
    }
    
    if (source === 'all' || source === 'nws') {
      const nwsUpdates = await scrapeNWSUpdates();
      updates.push(...nwsUpdates);
    }
    
    // Sort by timestamp, most recent first
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const result = {
      disaster_id: disasterId,
      updates,
      sources: ['fema', 'redcross', 'nws'],
      last_updated: new Date().toISOString()
    };
    
    // Cache for 30 minutes
    await CacheManager.set(cacheKey, result, 30);
    
    console.log(`Official updates fetched for disaster ${disasterId}: ${updates.length} updates`);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Mock scraping functions (in production, implement actual web scraping)
async function scrapeFEMAUpdates() {
  try {
    // Mock FEMA updates - in production, scrape from actual FEMA RSS feeds or APIs
    return [
      {
        id: 'fema_001',
        source: 'FEMA',
        title: 'Disaster Relief Centers Opened in Affected Areas',
        content: 'FEMA has opened three disaster relief centers in Manhattan, Brooklyn, and Queens to provide immediate assistance to flood victims.',
        url: 'https://www.fema.gov/disaster/current',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'relief_centers',
        priority: 'high'
      },
      {
        id: 'fema_002',
        source: 'FEMA',
        title: 'Individual Assistance Available for Flood Victims',
        content: 'Residents affected by flooding can now apply for FEMA Individual Assistance. Applications can be submitted online or by calling 1-800-621-3362.',
        url: 'https://www.fema.gov/assistance/individual',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'assistance',
        priority: 'medium'
      }
    ];
  } catch (error) {
    console.error('FEMA scraping error:', error);
    return [];
  }
}

async function scrapeRedCrossUpdates() {
  try {
    // Mock Red Cross updates
    return [
      {
        id: 'redcross_001',
        source: 'Red Cross',
        title: 'Emergency Shelters Operating at Full Capacity',
        content: 'All Red Cross emergency shelters in the NYC area are currently operating. Additional shelter space being arranged.',
        url: 'https://www.redcross.org/local/new-york',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        category: 'shelters',
        priority: 'high'
      },
      {
        id: 'redcross_002',
        source: 'Red Cross',
        title: 'Volunteer Opportunities Available',
        content: 'The Red Cross is seeking volunteers to help with disaster response efforts. Training provided on-site.',
        url: 'https://www.redcross.org/volunteer',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        category: 'volunteers',
        priority: 'medium'
      }
    ];
  } catch (error) {
    console.error('Red Cross scraping error:', error);
    return [];
  }
}

async function scrapeNWSUpdates() {
  try {
    // Mock National Weather Service updates
    return [
      {
        id: 'nws_001',
        source: 'National Weather Service',
        title: 'Flood Warning Extended Until Friday',
        content: 'The flood warning for the NYC metropolitan area has been extended until Friday at 6 PM. Residents should continue to avoid flooded roads.',
        url: 'https://www.weather.gov/nyc',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        category: 'weather',
        priority: 'critical'
      },
      {
        id: 'nws_002',
        source: 'National Weather Service',
        title: 'River Levels Stabilizing',
        content: 'Water levels on major rivers in the area are beginning to stabilize, though flooding remains a concern in low-lying areas.',
        url: 'https://www.weather.gov/nyc/rivers',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        category: 'conditions',
        priority: 'medium'
      }
    ];
  } catch (error) {
    console.error('NWS scraping error:', error);
    return [];
  }
}

export default router;
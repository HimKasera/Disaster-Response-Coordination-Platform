import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { CacheManager } from '../config/supabase.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// POST /geocoding - Extract location and convert to coordinates
router.post('/', async (req, res, next) => {
  try {
    const { text, location_name } = req.body;
    
    if (!text && !location_name) {
      return res.status(400).json({ error: 'Either text or location_name is required' });
    }
    
    let locationToGeocode = location_name;
    
    // Extract location from text using Gemini if needed
    if (text && !location_name) {
      const cacheKey = `location_extract_${Buffer.from(text).toString('base64')}`;
      let cachedResult = await CacheManager.get(cacheKey);
      
      if (!cachedResult) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const prompt = `Extract the most specific location name from this disaster description. Return only the location name (e.g., "Manhattan, NYC" or "Houston, Texas"). If no specific location is found, return "NONE".

Description: ${text}`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          locationToGeocode = response.text().trim();
          
          if (locationToGeocode === 'NONE') {
            return res.status(400).json({ error: 'No location found in the provided text' });
          }
          
          await CacheManager.set(cacheKey, locationToGeocode, 60);
        } catch (error) {
          console.error('Gemini API error:', error);
          return res.status(500).json({ error: 'Failed to extract location from text' });
        }
      } else {
        locationToGeocode = cachedResult;
      }
    }
    
    // Geocode the location
    const geocodeResult = await geocodeLocation(locationToGeocode);
    
    if (!geocodeResult) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    console.log(`Location geocoded: ${locationToGeocode} -> ${geocodeResult.lat}, ${geocodeResult.lng}`);
    
    res.json({
      location_name: locationToGeocode,
      coordinates: geocodeResult,
      extracted_from_text: !!text
    });
  } catch (error) {
    next(error);
  }
});

// Geocoding function supporting multiple services
async function geocodeLocation(locationName) {
  const cacheKey = `geocode_${Buffer.from(locationName).toString('base64')}`;
  let cachedResult = await CacheManager.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  let coordinates = null;
  
  // Try Google Maps first
  if (process.env.GOOGLE_MAPS_API_KEY) {
    coordinates = await geocodeWithGoogleMaps(locationName);
  }
  
  // Fallback to OpenStreetMap/Nominatim
  if (!coordinates) {
    coordinates = await geocodeWithNominatim(locationName);
  }
  
  // Fallback to Mapbox
  if (!coordinates && process.env.MAPBOX_ACCESS_TOKEN) {
    coordinates = await geocodeWithMapbox(locationName);
  }
  
  if (coordinates) {
    await CacheManager.set(cacheKey, coordinates, 1440); // Cache for 24 hours
  }
  
  return coordinates;
}

async function geocodeWithGoogleMaps(locationName) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: locationName,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: response.data.results[0].formatted_address,
        source: 'google_maps'
      };
    }
  } catch (error) {
    console.error('Google Maps geocoding error:', error.message);
  }
  return null;
}

async function geocodeWithMapbox(locationName) {
  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json`, {
      params: {
        access_token: process.env.MAPBOX_ACCESS_TOKEN,
        limit: 1
      }
    });
    
    if (response.data.features && response.data.features.length > 0) {
      const coordinates = response.data.features[0].center;
      return {
        lat: coordinates[1],
        lng: coordinates[0],
        formatted_address: response.data.features[0].place_name,
        source: 'mapbox'
      };
    }
  } catch (error) {
    console.error('Mapbox geocoding error:', error.message);
  }
  return null;
}

async function geocodeWithNominatim(locationName) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'DisasterResponsePlatform/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        source: 'openstreetmap'
      };
    }
  } catch (error) {
    console.error('Nominatim geocoding error:', error.message);
  }
  return null;
}

export default router;
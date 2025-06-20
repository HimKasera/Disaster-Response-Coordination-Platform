import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /disasters/:id/resources - Get resources near disaster location
router.get('/:id/resources', async (req, res, next) => {
  try {
    const { id: disasterId } = req.params;
    const { lat, lon, radius = 10000 } = req.query; // radius in meters, default 10km
    
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', disasterId);
    
    // If coordinates provided, find resources within radius
    if (lat && lon) {
      // Using PostGIS ST_DWithin for geospatial query
      const point = `POINT(${lon} ${lat})`;
      query = query.rpc('find_resources_within_distance', {
        disaster_id: disasterId,
        center_point: point,
        distance_meters: parseInt(radius)
      });
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.to(`disaster_${disasterId}`).emit('resources_updated', {
      disaster_id: disasterId,
      resources: data
    });
    
    console.log(`Resources fetched for disaster ${disasterId}: ${data?.length || 0} resources`);
    
    res.json({
      disaster_id: disasterId,
      resources: data || [],
      query_params: { lat, lon, radius }
    });
  } catch (error) {
    next(error);
  }
});

// POST /disasters/:id/resources - Add resource
router.post('/:id/resources', async (req, res, next) => {
  try {
    const { id: disasterId } = req.params;
    const { name, location_name, type, description, coordinates } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const resourceData = {
      disaster_id: disasterId,
      name,
      location_name,
      type,
      description,
      created_by: req.user.id
    };
    
    // Add coordinates if provided
    if (coordinates && coordinates.lat && coordinates.lng) {
      resourceData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
    }
    
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.to(`disaster_${disasterId}`).emit('resources_updated', {
      disaster_id: disasterId,
      action: 'create',
      resource: data
    });
    
    console.log(`Resource created: ${data.name} for disaster ${disasterId} by ${req.user.username}`);
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// GET /resources/nearby - Find resources near coordinates
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lon, radius = 5000, type } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Build geospatial query
    let query = supabase.rpc('find_nearby_resources', {
      center_lat: parseFloat(lat),
      center_lon: parseFloat(lon),
      radius_meters: parseInt(radius)
    });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`Nearby resources found: ${data?.length || 0} within ${radius}m of ${lat},${lon}`);
    
    res.json({
      resources: data || [],
      center: { lat: parseFloat(lat), lon: parseFloat(lon) },
      radius: parseInt(radius)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
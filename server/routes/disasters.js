import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /disasters - List disasters with filtering
router.get('/', async (req, res, next) => {
  try {
    const { tag, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select(`
        *,
        reports:reports(count)
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    console.log(`Disasters fetched: ${data?.length || 0} records`);
    
    res.json({
      disasters: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    next(error);
  }
});

// POST /disasters - Create disaster
router.post('/', requireRole('contributor'), async (req, res, next) => {
  try {
    const { title, location_name, description, tags = [] } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const disasterData = {
      title,
      location_name,
      description,
      tags,
      owner_id: req.user.id,
      audit_trail: [{
        action: 'create',
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      }]
    };
    
    const { data, error } = await supabase
      .from('disasters')
      .insert(disasterData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.emit('disaster_updated', {
      action: 'create',
      disaster: data
    });
    
    console.log(`Disaster created: ${data.title} by ${req.user.username}`);
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// GET /disasters/:id - Get single disaster
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('disasters')
      .select(`
        *,
        reports:reports(*),
        resources:resources(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /disasters/:id - Update disaster
router.put('/:id', requireRole('contributor'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, location_name, description, tags } = req.body;
    
    // Get existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw fetchError;
    }
    
    // Check ownership or admin role
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own disasters' });
    }
    
    // Update audit trail
    const updatedAuditTrail = [
      ...existing.audit_trail,
      {
        action: 'update',
        user_id: req.user.id,
        timestamp: new Date().toISOString(),
        changes: { title, location_name, description, tags }
      }
    ];
    
    const { data, error } = await supabase
      .from('disasters')
      .update({
        title,
        location_name,
        description,
        tags,
        audit_trail: updatedAuditTrail
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.emit('disaster_updated', {
      action: 'update',
      disaster: data
    });
    
    console.log(`Disaster updated: ${data.title} by ${req.user.username}`);
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /disasters/:id - Delete disaster
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      throw error;
    }
    
    // Emit real-time update
    req.io.emit('disaster_updated', {
      action: 'delete',
      disaster: data
    });
    
    console.log(`Disaster deleted: ${data.title} by ${req.user.username}`);
    
    res.json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
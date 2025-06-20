import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cache utilities
export class CacheManager {
  static async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();
      
      if (error || !data) return null;
      
      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(key, value, ttlMinutes = 60) {
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  static async delete(key) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
}
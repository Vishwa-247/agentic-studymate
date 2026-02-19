import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type FavoriteType = 'topic' | 'company' | 'problem';

interface FavoritesData {
  topics: string[];
  companies: string[];
  problems: string[];
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoritesData>({
    topics: [],
    companies: [],
    problems: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load favorites from database on mount and when user changes
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites({ topics: [], companies: [], problems: [] });
      setLoading(false);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dsa_favorites')
        .select('item_type, item_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favData: FavoritesData = {
        topics: [],
        companies: [],
        problems: []
      };

      data?.forEach(fav => {
        if (fav.item_type === 'topic') {
          favData.topics.push(fav.item_id);
        } else if (fav.item_type === 'company') {
          favData.companies.push(fav.item_id);
        } else if (fav.item_type === 'problem') {
          favData.problems.push(fav.item_id);
        }
      });

      setFavorites(favData);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (type: FavoriteType, id: string) => {
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    try {
      const { error } = await supabase
        .from('dsa_favorites')
        .insert({
          user_id: user.id,
          item_type: type,
          item_id: id
        });

      if (error) throw error;

      setFavorites(prev => {
        const key = `${type}s` as keyof FavoritesData;
        const currentArray = prev[key] || [];
        return {
          ...prev,
          [key]: [...currentArray, id]
        };
      });

      toast.success('Added to favorites');
    } catch (error: any) {
      if (error.code === '23505') {
        // Already exists
        toast.info('Already in favorites');
      } else {
        console.error('Failed to add favorite:', error);
        toast.error('Failed to add to favorites');
      }
    }
  };

  const removeFromFavorites = async (type: FavoriteType, id: string) => {
    if (!user) {
      toast.error('Please sign in to manage favorites');
      return;
    }

    try {
      const { error } = await supabase
        .from('dsa_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', type)
        .eq('item_id', id);

      if (error) throw error;

      setFavorites(prev => {
        const key = `${type}s` as keyof FavoritesData;
        const currentArray = prev[key] || [];
        return {
          ...prev,
          [key]: currentArray.filter(item => item !== id)
        };
      });

      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const isFavorite = (type: FavoriteType, id: string) => {
    const favArray = favorites[type + 's' as keyof FavoritesData];
    return favArray ? favArray.includes(id) : false;
  };

  const toggleFavorite = async (type: FavoriteType, id: string) => {
    if (isFavorite(type, id)) {
      await removeFromFavorites(type, id);
    } else {
      await addToFavorites(type, id);
    }
  };

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };
};
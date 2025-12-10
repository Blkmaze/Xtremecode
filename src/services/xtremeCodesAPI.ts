import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIXED_PORTAL } from '../config/portal';
const STORAGE_KEY = 'xtreme_config';

export interface XtremeConfig {
  url: string;
  username: string;
  password: string;
}

export interface XtremeChannel {
  id: number;
  name: string;
  stream_type: 'live' | 'movie' | 'series';
  stream_icon: string;
  added: number;
  category_id: number;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  rating_key: string;
  rating_iso_3166_1: string;
  rating_iso_639_1: string;
}

export interface XtremeCategory {
  category_id: number;
  category_name: string;
  parent_id: number;
}

export interface XtremeStreamInfo {
  stream_id: number;
  name: string;
  url: string;
  stream_type: string;
  extension: string;
  cmd: string;
}

export interface XtremeEPGItem {
  id: string;
  title: string;
  description: string;
  start: number;
  end: number;
  channel_id: number;
  category_id: number;
}

class XtremeCodesAPI {
  private config: XtremeConfig | null = null;
  private baseUrl: string = '';

  async setConfig(config: XtremeConfig): Promise<void> {
  this.config = config;

  // If FIXED_PORTAL is set, force that; otherwise use whatever the user/config says
  const effectiveUrl = (FIXED_PORTAL ?? config.url).replace(/\/$/, '');
  this.baseUrl = effectiveUrl;

  // Save *full* config (including original url) so generic mode still works
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}


  async loadConfig(): Promise<XtremeConfig | null> {
  try {
    const savedConfig = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      const parsed: XtremeConfig = JSON.parse(savedConfig);
      this.config = parsed;

      const effectiveUrl = (FIXED_PORTAL ?? parsed.url).replace(/\/$/, '');
      this.baseUrl = effectiveUrl;

      return parsed;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return null;
}


  private ensureConfigured(): asserts this is { config: XtremeConfig; baseUrl: string } {
    if (!this.config || !this.baseUrl) {
      throw new Error('No configuration set');
    }
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<any> {
    this.ensureConfigured();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('username', this.config.username);
    url.searchParams.append('password', this.config.password);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/player_api.php', { action: 'user' });
      return !!(result && result.user_info !== undefined);
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getLiveCategories(): Promise<XtremeCategory[]> {
    try {
      const result = await this.makeRequest('/player_api.php', {
        action: 'get_live_categories',
      });
      return result || [];
    } catch (error) {
      console.error('Error getting live categories:', error);
      return [];
    }
  }

  async getVodCategories(): Promise<XtremeCategory[]> {
    try {
      const result = await this.makeRequest('/player_api.php', {
        action: 'get_vod_categories',
      });
      return result || [];
    } catch (error) {
      console.error('Error getting VOD categories:', error);
      return [];
    }
  }

  async getSeriesCategories(): Promise<XtremeCategory[]> {
    try {
      const result = await this.makeRequest('/player_api.php', {
        action: 'get_series_categories',
      });
      return result || [];
    } catch (error) {
      console.error('Error getting series categories:', error);
      return [];
    }
  }

  async getLiveStreams(categoryId?: number): Promise<XtremeChannel[]> {
    try {
      const params: Record<string, string> = { action: 'get_live_streams' };
      if (categoryId) {
        params.category_id = categoryId.toString();
      }
      const result = await this.makeRequest('/player_api.php', params);
      return result || [];
    } catch (error) {
      console.error('Error getting live streams:', error);
      return [];
    }
  }

  async getVodStreams(categoryId?: number): Promise<XtremeChannel[]> {
    try {
      const params: Record<string, string> = { action: 'get_vod_streams' };
      if (categoryId) {
        params.category_id = categoryId.toString();
      }
      const result = await this.makeRequest('/player_api.php', params);
      return result || [];
    } catch (error) {
      console.error('Error getting VOD streams:', error);
      return [];
    }
  }

  async getSeriesStreams(categoryId?: number): Promise<XtremeChannel[]> {
    try {
      const params: Record<string, string> = { action: 'get_series' };
      if (categoryId) {
        params.category_id = categoryId.toString();
      }
      const result = await this.makeRequest('/player_api.php', params);
      return result || [];
    } catch (error) {
      console.error('Error getting series streams:', error);
      return [];
    }
  }

  async getStreamUrl(
    streamId: number,
    streamType: string,
    extension: string = 'ts'
  ): Promise<string> {
    this.ensureConfigured();

    const streamTypeMap: Record<string, string> = {
      live: 'live',
      movie: 'movie',
      series: 'series',
    };

    const type = streamTypeMap[streamType] || 'live';
    return `${this.baseUrl}/${type}/${streamId}.${extension}`;
  }

  async getEPG(streamId: number, limit: number = 10): Promise<XtremeEPGItem[]> {
    try {
      const result = await this.makeRequest('/player_api.php', {
        action: 'get_short_epg',
        stream_id: streamId.toString(),
        limit: limit.toString(),
      });
      return result || [];
    } catch (error) {
      console.error('Error getting EPG:', error);
      return [];
    }
  }

  async getSeriesInfo(seriesId: number): Promise<any> {
    try {
      const result = await this.makeRequest('/player_api.php', {
        action: 'get_series_info',
        series_id: seriesId.toString(),
      });
      return result || {};
    } catch (error) {
      console.error('Error getting series info:', error);
      return {};
    }
  }

  async getVodInfo(movieId: number): Promise<any> {
    try {
      const result = await this.makeRequest('/player_api.php', {
        action: 'get_vod_info',
        vod_id: movieId.toString(),
      });
      return result || {};
    } catch (error) {
      console.error('Error getting VOD info:', error);
      return {};
    }
  }
}

export default new XtremeCodesAPI();

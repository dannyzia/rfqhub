import { pool } from '../config/database';
import { redisClient } from '../config/redis';
import { TenderMode } from '../types/tender.types';

export interface TenderMigration {
  id: string;
  tenderId: string;
  fromMode: string;
  toMode: string;
  migrationType: 'auto_backfill' | 'manual_switch' | 'upgrade';
  migratedAt: Date;
  migratedBy: string;
  metadata: any;
}

export interface TenderModeStats {
  tenderMode: string;
  apiVersion: string;
  isGovtTender: boolean;
  totalCount: number;
  publishedCount: number;
  awardedCount: number;
  liveTenderingCount: number;
  avgDaysToAward: number;
}

export const tenderMigrationService = {
  /**
   * Migrate a tender to a new mode
   */
  async migrateTenderMode(
    tenderId: string, 
    newMode: TenderMode, 
    migratedBy: string
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT migrate_tender_mode($1, $2, $3)',
        [tenderId, newMode, migratedBy]
      );
      
      if (result.rows[0].migrate_tender_mode) {
        // Clear any cached data for this tender
        await this.clearTenderCache(tenderId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Tender mode migration error:', error);
      throw error;
    }
  },
  
  /**
   * Get migration history for a tender
   */
  async getMigrationHistory(tenderId: string): Promise<TenderMigration[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM get_tender_migration_history($1)',
        [tenderId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        tenderId: tenderId,
        fromMode: row.from_mode,
        toMode: row.to_mode,
        migrationType: row.migration_type,
        migratedAt: row.migrated_at,
        migratedBy: row.migrated_by,
        metadata: row.metadata
      }));
    } catch (error) {
      console.error('Get migration history error:', error);
      throw error;
    }
  },
  
  /**
   * Get tender mode statistics
   */
  async getTenderModeStats(): Promise<TenderModeStats[]> {
    try {
      // Try to get from cache first
      const cached = await redisClient.get('tender_mode_stats');
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Query database
      const result = await pool.query('SELECT * FROM tender_mode_stats');
      const stats = result.rows;
      
      // Cache for 1 hour
      await redisClient.setex('tender_mode_stats', 3600, JSON.stringify(stats));
      
      return stats;
    } catch (error) {
      console.error('Get tender mode stats error:', error);
      throw error;
    }
  },
  
  /**
   * Backfill existing tenders with default modes
   */
  async backfillTenderModes(): Promise<number> {
    try {
      // This would be called during migration
      const result = await pool.query(`
        UPDATE tenders 
        SET 
          tender_mode = CASE 
            WHEN extended_data->'rfqDetails' IS NOT NULL THEN 'simple_rfq'
            ELSE 'detailed_rft'
          END,
          api_version = 'v1',
          is_govt_tender = true
        WHERE tender_mode IS NULL
        RETURNING id
      `);
      
      // Clear cache after backfill
      await this.clearStatsCache();
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Backfill tender modes error:', error);
      throw error;
    }
  },
  
  /**
   * Validate tender mode transition
   */
  validateModeTransition(currentMode: string, newMode: string): boolean {
    const validTransitions = [
      ['detailed_rft', 'live_auction'],
      ['simple_rfq', 'live_auction'],
      ['live_auction', 'detailed_rft'], // After auction ends
      ['live_auction', 'simple_rfq']    // After auction ends
    ];
    
    // Same mode is always valid
    if (currentMode === newMode) {
      return true;
    }
    
    return validTransitions.some(([from, to]) => from === currentMode && to === newMode);
  },
  
  /**
   * Get compatible tender modes for a given organization type
   */
  getCompatibleModes(organizationType: 'government' | 'non-government'): TenderMode[] {
    if (organizationType === 'government') {
      return [TenderMode.DetailedRFT, TenderMode.LiveAuction];
    } else {
      return [TenderMode.SimpleRFQ, TenderMode.LiveAuction];
    }
  },
  
  /**
   * Clear tender-related cache
   */
  async clearTenderCache(tenderId: string): Promise<void> {
    const keys = [
      `tender:${tenderId}`,
      `tender_stats:${tenderId}`,
      'tender_mode_stats'
    ];
    
    await Promise.all(keys.map(key => redisClient.del(key)));
  },
  
  /**
   * Clear stats cache
   */
  async clearStatsCache(): Promise<void> {
    await redisClient.del('tender_mode_stats');
  },
  
  /**
   * Create compatibility layer for v1 API requests
   */
  async getTenderForV1API(tenderId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT 
           id, tender_number, title, description, status, 
           created_at, updated_at, extended_data
         FROM tenders 
         WHERE id = $1`,
        [tenderId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const tender = result.rows[0];
      
      // Transform to v1 format if needed
      if (tender.extended_data?.rfqDetails) {
        // Simple RFQ format
        return {
          ...tender,
          rfqDetails: tender.extended_data.rfqDetails,
          buyerInfo: tender.extended_data.buyerInfo
        };
      } else {
        // Detailed RFT format
        return {
          ...tender,
          procuringEntity: tender.extended_data?.procuringEntity,
          timeline: tender.extended_data?.timeline,
          lots: tender.extended_data?.lots
        };
      }
    } catch (error) {
      console.error('Get tender for v1 API error:', error);
      throw error;
    }
  }
};
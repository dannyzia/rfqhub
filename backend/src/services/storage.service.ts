import pool from '../config/database';
import logger from '../config/logger';
import { FileUpload, StorageUsage } from '../types/subscription.types';

export class StorageService {
  
  /**
   * Get storage usage for an organization
   */
  static async getStorageUsage(organizationId: string): Promise<StorageUsage> {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM organization_storage_usage 
        WHERE organization_id = $1
      `, [organizationId]);
      
      if (rows.length === 0) {
        // Initialize storage usage for new organization
        await pool.query(`
          INSERT INTO organization_storage_usage (organization_id, used_bytes, last_calculated_at)
          VALUES ($1, 0, NOW())
          ON CONFLICT (organization_id) DO NOTHING
        `, [organizationId]);
        
        return {
          organization_id: organizationId,
          used_bytes: 0,
          last_calculated_at: new Date().toISOString()
        };
      }
      
      return rows[0];
    } catch (error) {
      logger.error('Failed to get storage usage', { error, organizationId });
      throw error;
    }
  }

  /**
   * Check and record file upload in a single atomic operation
   * This prevents race conditions by using row locking within a transaction
   */
  static async checkAndRecordUpload(
    organizationId: string,
    tenderId: string | null,
    uploadedBy: string,
    originalName: string,
    storedKey: string,
    mimeType: string | null,
    fileSizeBytes: number,
    uploadPath: string | null = null
  ): Promise<{ allowed: boolean; fileUpload?: FileUpload; reason?: string }> {
    const client = await pool.connect();
    let transactionStarted = false;
    
    try {
      await client.query('BEGIN');
      transactionStarted = true;
      
      // Validate file size
      if (fileSizeBytes <= 0) {
        await client.query('ROLLBACK');
        return { allowed: false, reason: 'File size must be greater than 0' };
      }
      
      // Lock the storage usage row for this organization using FOR UPDATE
      // This prevents other transactions from reading or modifying the same row
      const { rows: storageRows } = await client.query(`
        SELECT * FROM organization_storage_usage 
        WHERE organization_id = $1
        FOR UPDATE
      `, [organizationId]);
      
      let storageUsage;
      if (storageRows.length === 0) {
        // Initialize storage usage for new organization
        await client.query(`
          INSERT INTO organization_storage_usage (organization_id, used_bytes, last_calculated_at)
          VALUES ($1, 0, NOW())
          ON CONFLICT (organization_id) DO NOTHING
        `, [organizationId]);
        storageUsage = {
          organization_id: organizationId,
          used_bytes: 0,
          last_calculated_at: new Date().toISOString()
        };
      } else {
        storageUsage = storageRows[0];
      }
      
      // Get subscription info within the transaction
      const { rows: subRows } = await client.query(`
        SELECT os.*, sp.storage_limit_bytes, sp.custom_storage_bytes
        FROM organization_subscriptions os
        JOIN subscription_packages sp ON os.package_id = sp.id
        WHERE os.organization_id = $1 AND os.status = 'active'
      `, [organizationId]);
      
      const subscription = subRows[0] || null;
      
      if (!subscription) {
        await client.query('ROLLBACK');
        return { allowed: false, reason: 'No active subscription' };
      }
      
      const storageLimit = subscription.custom_storage_bytes || subscription.storage_limit_bytes;
      
      if (storageLimit !== null) {
        // Check if upload would exceed quota
        if ((storageUsage.used_bytes + fileSizeBytes) > storageLimit) {
          await client.query('ROLLBACK');
          return { allowed: false, reason: 'Storage quota exceeded' };
        }
      }
      
      // Record file upload
      const { rows: fileRows } = await client.query(`
        INSERT INTO file_uploads 
        (organization_id, tender_id, uploaded_by, original_name, stored_key, mime_type, file_size_bytes, upload_path)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [organizationId, tenderId, uploadedBy, originalName, storedKey, mimeType, fileSizeBytes, uploadPath]);
      
      const fileUpload = fileRows[0];
      
      // Update storage usage
      await client.query(`
        UPDATE organization_storage_usage 
        SET used_bytes = used_bytes + $1, last_calculated_at = NOW()
        WHERE organization_id = $2
      `, [fileSizeBytes, organizationId]);
      
      await client.query('COMMIT');
      
      logger.info('File upload checked and recorded atomically', { 
        organizationId, 
        tenderId, 
        fileSizeBytes,
        storedKey,
        newUsage: storageUsage.used_bytes + fileSizeBytes
      });
      
      return { allowed: true, fileUpload };
      
    } catch (error) {
      if (transactionStarted) {
        await client.query('ROLLBACK');
      }
      logger.error('Failed to check and record file upload', { error, organizationId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if organization can upload a file based on storage quota
   * @deprecated Use checkAndRecordUpload for atomic operations to prevent race conditions
   */
  static async canUploadFile(organizationId: string, fileSizeBytes: number): Promise<boolean> {
    try {
      const storageUsage = await this.getStorageUsage(organizationId);
      const subscription = await this.getOrganizationSubscription(organizationId);
      
      if (!subscription) {
        return false; // No active subscription
      }
      
      const storageLimit = subscription.custom_storage_bytes || subscription.storage_limit_bytes;
      
      if (storageLimit === null) {
        return true; // Unlimited storage for custom packages
      }
      
      return (storageUsage.used_bytes + fileSizeBytes) <= storageLimit;
      
    } catch (error) {
      logger.error('Failed to check upload quota', { error, organizationId, fileSizeBytes });
      throw error;
    }
  }

  /**
   * Record file upload and update storage usage
   */
  static async recordFileUpload(
    organizationId: string,
    tenderId: string | null,
    uploadedBy: string,
    originalName: string,
    storedKey: string,
    mimeType: string | null,
    fileSizeBytes: number,
    uploadPath: string | null = null
  ): Promise<FileUpload> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Record file upload
      const { rows } = await client.query(`
        INSERT INTO file_uploads 
        (organization_id, tender_id, uploaded_by, original_name, stored_key, mime_type, file_size_bytes, upload_path)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [organizationId, tenderId, uploadedBy, originalName, storedKey, mimeType, fileSizeBytes, uploadPath]);
      
      const fileUpload = rows[0];
      
      // Update storage usage
      await client.query(`
        UPDATE organization_storage_usage 
        SET used_bytes = used_bytes + $1, last_calculated_at = NOW()
        WHERE organization_id = $2
      `, [fileSizeBytes, organizationId]);
      
      await client.query('COMMIT');
      
      logger.info('File upload recorded', { 
        organizationId, 
        tenderId, 
        fileSizeBytes,
        storedKey 
      });
      
      return fileUpload;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to record file upload', { error, organizationId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete a file and update storage usage
   */
  static async deleteFileUpload(fileId: string, organizationId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get file info before deletion
      const { rows } = await client.query(`
        SELECT file_size_bytes FROM file_uploads 
        WHERE id = $1 AND organization_id = $2 AND is_deleted = false
      `, [fileId, organizationId]);
      
      if (rows.length === 0) {
        throw new Error('File not found or already deleted');
      }
      
      const fileSizeBytes = rows[0].file_size_bytes;
      
      // Validate file size is positive before updating storage usage
      if (fileSizeBytes <= 0) {
        logger.warn('Invalid file size detected during deletion', { fileId, organizationId, fileSizeBytes });
        throw new Error('Invalid file size: must be greater than 0');
      }
      
      // Soft delete the file
      await client.query(`
        UPDATE file_uploads 
        SET is_deleted = true, deleted_at = NOW()
        WHERE id = $1 AND organization_id = $2
      `, [fileId, organizationId]);
      
      // Update storage usage (subtract file size)
      await client.query(`
        UPDATE organization_storage_usage 
        SET used_bytes = GREATEST(used_bytes - $1, 0), last_calculated_at = NOW()
        WHERE organization_id = $2
      `, [fileSizeBytes, organizationId]);
      
      await client.query('COMMIT');
      
      logger.info('File deleted', { fileId, organizationId, fileSizeBytes });
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to delete file', { error, fileId, organizationId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get file uploads for an organization
   */
  static async getOrganizationFiles(
    organizationId: string, 
    tenderId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<FileUpload[]> {
    try {
      let query = `
        SELECT * FROM file_uploads 
        WHERE organization_id = $1 AND is_deleted = false
      `;
      const params: any[] = [organizationId];
      
      if (tenderId) {
        query += ' AND tender_id = $2';
        params.push(tenderId);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const { rows } = await pool.query(query, params);
      return rows;
    } catch (error) {
      logger.error('Failed to get organization files', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get file upload by ID
   */
  static async getFileUpload(fileId: string, organizationId: string): Promise<FileUpload | null> {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM file_uploads 
        WHERE id = $1 AND organization_id = $2 AND is_deleted = false
      `, [fileId, organizationId]);
      
      return rows[0] || null;
    } catch (error) {
      logger.error('Failed to get file upload', { error, fileId });
      throw error;
    }
  }

  /**
   * Recalculate storage usage for an organization
   */
  static async recalculateStorageUsage(organizationId: string): Promise<void> {
    try {
      const { rows } = await pool.query(`
        SELECT COALESCE(SUM(file_size_bytes), 0) as total_bytes
        FROM file_uploads 
        WHERE organization_id = $1 AND is_deleted = false
      `, [organizationId]);
      
      const totalBytes = rows[0].total_bytes;
      
      await pool.query(`
        UPDATE organization_storage_usage 
        SET used_bytes = $1, last_calculated_at = NOW()
        WHERE organization_id = $2
      `, [totalBytes, organizationId]);
      
      logger.info('Storage usage recalculated', { organizationId, totalBytes });
      
    } catch (error) {
      logger.error('Failed to recalculate storage usage', { error, organizationId });
      throw error;
    }
  }

  /**
   * Get organization subscription info
   */
  private static async getOrganizationSubscription(organizationId: string): Promise<any> {
    try {
      const { rows } = await pool.query(`
        SELECT os.*, sp.storage_limit_bytes, sp.custom_storage_bytes
        FROM organization_subscriptions os
        JOIN subscription_packages sp ON os.package_id = sp.id
        WHERE os.organization_id = $1 AND os.status = 'active'
      `, [organizationId]);
      
      return rows[0] || null;
    } catch (error) {
      logger.error('Failed to get organization subscription', { error, organizationId });
      throw error;
    }
  }
}

// Compatibility export alias
export const storageService = StorageService;

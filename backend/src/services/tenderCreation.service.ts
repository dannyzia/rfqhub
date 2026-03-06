import pool from '../config/database';
import logger from '../config/logger';
import { SubscriptionService } from './subscription.service';
import { RoleAssignmentService } from './roleAssignment.service';
import { TenderTypeDefinition } from '../types/tender.types';

export class TenderCreationService {
  
  /**
   * Validate tender creation against quotas and subscription limits
   */
  static async validateTenderCreation(
    organizationId: string,
    tenderType: 'simple_rfq' | 'detailed_tender',
    isLiveTendering: boolean = false
  ): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      // Check subscription
      const subscription = await SubscriptionService.getOrganizationSubscription(organizationId);
      
      if (!subscription) {
        return { canCreate: false, reason: 'No active subscription' };
      }
      
      // Check tender quota
      const canCreateTender = await SubscriptionService.checkTenderQuota(organizationId, tenderType);
      if (!canCreateTender) {
        return { canCreate: false, reason: 'Tender creation quota exceeded' };
      }
      
      // Check live tendering if requested
      if (isLiveTendering && !subscription.live_tendering_enabled) {
        return { canCreate: false, reason: 'Live tendering not enabled in subscription' };
      }
      
      return { canCreate: true };
    } catch (error) {
      logger.error('Failed to validate tender creation', { error, organizationId, tenderType });
      throw error;
    }
  }

  /**
   * Create tender with automatic role assignments
   */
  static async createTenderWithWorkflow(
    tenderData: any,
    userId: string,
    organizationId: string
  ): Promise<any> {
    const tenderType = tenderData.is_simple_rfq ? 'simple_rfq' : 'detailed_tender';
    
    // Check and increment quota atomically before starting the main transaction
    // This prevents race conditions by using row locking within a transaction
    const quotaResult = await SubscriptionService.checkAndIncrementQuota(organizationId, tenderType);
    
    if (!quotaResult.allowed) {
      throw new Error('Tender creation quota exceeded for this week');
    }
    
    // Check subscription for live tendering capability
    const subscription = await SubscriptionService.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      throw new Error('No active subscription');
    }
    
    // Check live tendering if requested
    if (tenderData.is_live_tendering && !subscription.live_tendering_enabled) {
      throw new Error('Live tendering not enabled in subscription');
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get tender type definition for workflow configuration
      const tenderTypeDef = await this.getTenderTypeDefinition(tenderData.tender_type);
      
      // Create the tender
      const { rows } = await client.query(`
        INSERT INTO tenders (
          title, description, tender_number, tender_type, procurement_type,
          currency, submission_deadline, bid_opening_time, organization_id,
          created_by, is_simple_rfq, is_live_tendering, live_session_id,
          tender_mode, is_govt_tender, workflow_status, current_workflow_role,
          budget, fund_allocation, bid_security_amount, two_envelope_system,
          validity_days, price_basis, pre_bid_meeting_date, pre_bid_meeting_link,
          api_version, published_at, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), 'draft'
        )
        RETURNING *
      `, [
        tenderData.title,
        tenderData.description,
        tenderData.tender_number,
        tenderData.tender_type,
        tenderData.procurement_type,
        tenderData.currency,
        tenderData.submission_deadline,
        tenderData.bid_opening_time,
        organizationId,
        userId,
        tenderData.is_simple_rfq,
        tenderData.is_live_tendering,
        tenderData.live_session_id || null,
        tenderData.tender_mode || null,
        tenderData.is_govt_tender || false,
        'draft',
        'procurer', // Default workflow role
        tenderData.budget || null,
        tenderData.fund_allocation || null,
        tenderData.bid_security_amount || null,
        tenderData.two_envelope_system || false,
        tenderData.validity_days || null,
        tenderData.price_basis || null,
        tenderData.pre_bid_meeting_date || null,
        tenderData.pre_bid_meeting_link || null,
        tenderData.api_version || 'v1',
        tenderData.published_at || null
      ]);
      
      const tender = rows[0];
      
      // Auto-assign procurer role to creator
      await RoleAssignmentService.assignRole(
        tender.id,
        'procurer',
        userId,
        userId,
        true, // Self-assignment
        'Auto-assigned as tender creator'
      );
      
      // Auto-assign other roles based on tender type configuration
      if (tenderTypeDef) {
        await this.autoAssignRoles(tender.id, tenderTypeDef, userId, organizationId);
      }
      
      // Create live session if live tendering
      if (tenderData.is_live_tendering && tenderData.is_live_tendering) {
        await this.createLiveSession(tender.id, userId);
      }
      
      await client.query('COMMIT');
      
      logger.info('Tender created with workflow', { 
        tenderId: tender.id, 
        tenderType: tenderData.tender_type,
        userId,
        organizationId 
      });
      
      return tender;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create tender with workflow', { error, organizationId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Auto-assign roles based on tender type configuration
   */
  private static async autoAssignRoles(
    tenderId: string,
    tenderTypeDef: TenderTypeDefinition,
    userId: string,
    organizationId: string
  ): Promise<void> {
    try {
      const formConfig = tenderTypeDef.form_segment_config;
      
      if (!formConfig || !formConfig.segments) {
        return;
      }
      
      // Define role assignment rules based on segments
      const roleRules: Record<string, string> = {
        'S1': 'procurer',           // Basic info
        'S2': 'procurer',           // Scope & requirements
        'S3': 'procurer',           // Timeline & delivery
        'S4': 'procurer',           // Evaluation criteria
        'S5': 'procurer',           // Technical specifications
        'S6': 'procurer',           // Commercial terms
        'S7': 'procurer',           // Documents
        'S8': 'procurer',           // Tender security (conditional)
        'S9': 'prequal_evaluator',  // Pre-qualification
        'S10': 'tech_evaluator',     // Technical evaluation
        'S11': 'commercial_evaluator', // Commercial evaluation
        'S12': 'auditor',           // Audit
        'S13': 'procurement_head',  // Final approval
        'S14': 'procurement_head'   // Award decision
      };
      
      // Get available evaluators for the organization
      const evaluators = await this.getAvailableEvaluators(organizationId);
      
      // Assign roles based on active segments
      for (const segment of formConfig.segments) {
        const roleType = roleRules[segment];
        
        if (roleType && roleType !== 'procurer') {
          // Find available evaluator for this role
          const availableEvaluators = evaluators.filter(e => 
            e.roles.includes(roleType.replace('_evaluator', ''))
          );
          
          if (availableEvaluators.length > 0) {
            // Assign first available evaluator
            await RoleAssignmentService.assignRole(
              tenderId,
              roleType as any,
              availableEvaluators[0].id,
              userId,
              false,
              `Auto-assigned for segment ${segment}`
            );
          }
        }
      }
      
    } catch (error) {
      logger.error('Failed to auto-assign roles', { error, tenderId });
      // Don't throw error - this is optional functionality
    }
  }

  /**
   * Create live session for tender
   */
  static async createLiveSession(tenderId: string, userId: string): Promise<void> {
    try {
      // This would integrate with the existing live bidding session system
      // For now, we'll create a basic session record
      await pool.query(`
        INSERT INTO live_bidding_sessions 
        (tender_id, created_by, status, starts_at, created_at)
        VALUES ($1, $2, 'scheduled', NOW(), NOW())
        ON CONFLICT (tender_id) DO UPDATE
        SET status = 'scheduled', updated_at = NOW()
      `, [tenderId, userId]);
      
      // Update tender with session ID
      await pool.query(`
        UPDATE tenders 
        SET live_session_id = (
          SELECT id FROM live_bidding_sessions 
          WHERE tender_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        )
        WHERE id = $2
      `, [tenderId, tenderId]);
      
      logger.info('Live session created', { tenderId, userId });
      
    } catch (error) {
      logger.error('Failed to create live session', { error, tenderId, userId });
      throw error;
    }
  }

  /**
   * Get tender type definition
   */
  private static async getTenderTypeDefinition(tenderTypeCode: string): Promise<TenderTypeDefinition | null> {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM tender_type_definitions 
        WHERE code = $1 AND is_active = true
      `, [tenderTypeCode]);
      
      return rows[0] || null;
    } catch (error) {
      logger.error('Failed to get tender type definition', { error, tenderTypeCode });
      return null;
    }
  }

  /**
   * Get available evaluators for organization
   */
  private static async getAvailableEvaluators(organizationId: string): Promise<any[]> {
    try {
      const { rows } = await pool.query(`
        SELECT id, name, email, roles 
        FROM users 
        WHERE organization_id = $1 
        AND ($2 = ANY(roles) OR $3 = ANY(roles) OR $4 = ANY(roles))
        AND is_active = true
        ORDER BY name
      `, [organizationId, 'prequal_evaluator', 'tech_evaluator', 'commercial_evaluator']);
      
      return rows;
    } catch (error) {
      logger.error('Failed to get available evaluators', { error, organizationId });
      return [];
    }
  }

  /**
   * Update tender workflow status
   */
  static async updateWorkflowStatus(
    tenderId: string,
    status: 'draft' | 'active' | 'completed' | 'cancelled' | 'awarded',
    currentRole?: string
  ): Promise<void> {
    try {
      const updateFields = ['workflow_status = $1', 'updated_at = NOW()'];
      const values = [status];
      
      if (currentRole) {
        updateFields.push('current_workflow_role = $2');
        values.push(currentRole as any);
      }
      
      await pool.query(`
        UPDATE tenders 
        SET ${updateFields.join(', ')}
        WHERE id = $${values.length + 1}
      `, [...values, tenderId]);
      
      logger.info('Tender workflow status updated', { tenderId, status, currentRole });
      
    } catch (error) {
      logger.error('Failed to update workflow status', { error, tenderId, status });
      throw error;
    }
  }

  /**
   * Get tender workflow status
   */
  static async getWorkflowStatus(tenderId: string): Promise<any> {
    try {
      const { rows } = await pool.query(`
        SELECT workflow_status, current_workflow_role, status
        FROM tenders 
        WHERE id = $1
      `, [tenderId]);
      
      return rows[0] || null;
    } catch (error) {
      logger.error('Failed to get workflow status', { error, tenderId });
      throw error;
    }
  }

  /**
   * Check if tender can be published based on workflow
   */
  static async canPublishTender(tenderId: string): Promise<{ canPublish: boolean; reason?: string }> {
    try {
      const workflowStatus = await this.getWorkflowStatus(tenderId);
      
      if (!workflowStatus) {
        return { canPublish: false, reason: 'Tender not found' };
      }
      
      // Check if tender is in draft status
      if (workflowStatus.workflow_status !== 'draft') {
        return { canPublish: false, reason: 'Tender is not in draft status' };
      }
      
      // Check if procurer role is assigned and active
      const assignments = await RoleAssignmentService.getTenderRoleAssignments(tenderId);
      const procurerAssignment = assignments.find(a => a.role_type === 'procurer');
      
      if (!procurerAssignment) {
        return { canPublish: false, reason: 'Procurer role not assigned' };
      }
      
      if (procurerAssignment.status !== 'active') {
        return { canPublish: false, reason: 'Procurer role is not active' };
      }
      
      return { canPublish: true };
    } catch (error) {
      logger.error('Failed to check publish eligibility', { error, tenderId });
      throw error;
    }
  }
}

// Compatibility export alias
export const tenderCreationService = TenderCreationService;

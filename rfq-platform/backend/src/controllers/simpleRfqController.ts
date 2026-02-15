import { Request, Response } from 'express';
import { simpleRfqDataSchema } from '../schemas/tenderMode.schema';
import { simpleRfqDb } from '../services/simpleRfq.service';
import { OrganizationType } from '../types/organization.types';

// POST /tenders/simple-rfq
export async function createSimpleRfq(req: Request, res: Response) {
  try {
    const rfqData = simpleRfqDataSchema.parse(req.body);
    const userOrgType = req.user!.organizationType as OrganizationType;
    
    const tender = await simpleRfqDb.createSimpleRfq(rfqData, userOrgType);
    res.status(201).json({ tender });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid RFQ data' });
  }
}

// GET /tenders/simple-rfq/:id/response-form
export async function getSimpleRfqResponseForm(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const items = await simpleRfqDb.getSimpleRfqItems(id);
    if (!items) {
      res.status(404).json({ error: 'Simple RFQ not found' });
      return;
    }
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch response form' });
  }
}

// GET /tenders/simple-rfq/:id/tender-type
export async function getSimpleRfqTenderType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenderTypeData = await simpleRfqDb.getSimpleRfqTenderType(id);
    if (!tenderTypeData) {
      res.status(404).json({ error: 'Simple RFQ not found' });
      return;
    }
    res.json(tenderTypeData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tender type information' });
  }
}

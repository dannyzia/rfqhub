import request from 'supertest';
import { Express } from 'express';
import express from 'express';

// Mock controllers and middleware BEFORE importing routes
jest.mock('../../controllers/tender.controller', () => ({
  tenderController: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    cancel: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../middleware/validate.middleware', () => {
  const mockValidate = jest.fn((_schema: any) => (_req: any, _res: any, next: any) => next());
  return {
    validate: mockValidate,
  };
});

jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: jest.fn((_req: any, _res: any, next: any) => next()),
  authorize: jest.fn((..._roles: any[]) => (_req: any, _res: any, next: any) => next()),
}));

// Import after mocks
import { tenderRoutes } from '../tender.routes';
import { tenderController } from '../../controllers/tender.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

describe('Tender Routes', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/tenders', tenderRoutes);

    // Mock validate middleware
    (validate as jest.Mock).mockImplementation((_schema: any) => (_req: any, _res: any, next: any) => {
      next();
    });

    // Mock auth middleware - default buyer role
    (authenticate as jest.Mock).mockImplementation((req: any, _res: any, next: any) => {
      req.user = {
        id: 'user-001',
        email: 'buyer@example.com',
        role: 'buyer',
        roles: ['buyer'],
        orgId: 'org-buyer-001',
        companyId: 'org-buyer-001',
      };
      next();
    });

    (authorize as jest.Mock).mockImplementation((..._roles: any[]) => {
      return (req: any, res: any, next: any) => {
        if (req.user?.roles?.some((r: string) => _roles.includes(r))) {
          next();
        } else {
          res.status(403).json({ error: 'Forbidden' });
        }
      };
    });

    // Default controller implementations
    (tenderController.create as jest.Mock).mockImplementation((_req: any, res: any) => {
      res.status(201).json({ data: { id: 'tender-001', title: 'Test Tender' } });
    });

    (tenderController.findAll as jest.Mock).mockImplementation((_req: any, res: any) => {
      res.json({ data: [{ id: 'tender-001', title: 'Test Tender' }] });
    });

    (tenderController.findById as jest.Mock).mockImplementation((req: any, res: any) => {
      res.json({ data: { id: req.params.id, title: 'Test Tender' } });
    });

    (tenderController.update as jest.Mock).mockImplementation((req: any, res: any) => {
      res.json({ data: { id: req.params.id, title: 'Updated Tender' } });
    });

    (tenderController.publish as jest.Mock).mockImplementation((req: any, res: any) => {
      res.json({ data: { id: req.params.id, status: 'published' } });
    });

    (tenderController.cancel as jest.Mock).mockImplementation((req: any, res: any) => {
      res.json({ data: { id: req.params.id, status: 'cancelled' } });
    });

    (tenderController.delete as jest.Mock).mockImplementation((_req: any, res: any) => {
      res.json({ data: { message: 'Tender deleted successfully' } });
    });
  });

  describe('Tender Creation and Listing', () => {
    it('POST / should create tender', async () => {
      const response = await request(app)
        .post('/tenders')
        .send({ title: 'New Tender' });

      expect(response.status).toBe(201);
      expect(tenderController.create).toHaveBeenCalled();
    });

    it('GET / should list all tenders', async () => {
      const response = await request(app).get('/tenders');

      expect(response.status).toBe(200);
      expect(tenderController.findAll).toHaveBeenCalled();
    });

    it('GET /:id should retrieve tender details', async () => {
      const response = await request(app).get('/tenders/tender-001');

      expect(response.status).toBe(200);
      expect(tenderController.findById).toHaveBeenCalled();
    });
  });

  describe('Tender Management', () => {
    it('PUT /:id should update tender', async () => {
      const response = await request(app)
        .put('/tenders/tender-001')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(tenderController.update).toHaveBeenCalled();
    });

    it('POST /:id/publish should publish tender', async () => {
      const response = await request(app)
        .post('/tenders/tender-001/publish')
        .send({ invitedVendorIds: [] });

      expect(response.status).toBe(200);
      expect(tenderController.publish).toHaveBeenCalled();
    });

    it('POST /:id/cancel should cancel tender', async () => {
      const response = await request(app).post('/tenders/tender-001/cancel');

      expect(response.status).toBe(200);
      expect(tenderController.cancel).toHaveBeenCalled();
    });

    it('DELETE /:id should delete tender', async () => {
      const response = await request(app).delete('/tenders/tender-001');

      expect(response.status).toBe(200);
      expect(tenderController.delete).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((_req: any, res: any, _next: any) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app).get('/tenders');

      expect(response.status).toBe(401);
      expect(authenticate).toHaveBeenCalled();
    });
  });
});

import request from "supertest";
import app from "../../app";
import { pool } from "../../config/database";

describe("Simple RFQ End-to-End", () => {
  beforeAll(async () => {
    // Ensure required master data exists
    await pool.query(`
      INSERT INTO currency_master (code, name) VALUES ('BDT', 'Bangladeshi Taka') ON CONFLICT (code) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO tender_status_master (code) VALUES ('draft') ON CONFLICT (code) DO NOTHING
    `);
    // Migration 020 now allows NULL values for buyer_org_id and created_by
    // No need to create test organization/user - Simple RFQ works without authentication
  });

  afterAll(async () => {
    // Clean up any test data and close connections
    console.log('🧹 Simple RFQ test cleanup...');
  });
  let rfqId: string;
  const rfqPayload = {
    buyerInfo: {
      name: "Test Buyer",
      organization: "Test Org",
      contact: "test@example.com",
    },
    rfqDetails: {
      title: "Test RFQ",
      description: "Test description",
      rfqType: "goods",
      tenderType: "NRQ1",
      items: [
        { name: "Item 1", quantity: 10, unit: "pcs", specs: "Spec 1" },
        { name: "Item 2", quantity: 5, unit: "box", specs: "Spec 2" },
      ],
      deliveryLocation: "Dhaka",
      deliveryDate: "2026-03-01",
      paymentTerm: "on_delivery",
    },
  };

  it("should create a Simple RFQ", async () => {
    const res = await request(app)
      .post("/api/tenders/simple-rfq")
      .send(rfqPayload)
      .expect(201);
    expect(res.body.tender).toBeDefined();
    expect(res.body.tender.tender_mode).toBe("simple_rfq");
    rfqId = res.body.tender.id;
  });

  it("should fetch the Simple RFQ response form", async () => {
    const res = await request(app)
      .get(`/api/tenders/simple-rfq/${rfqId}/response-form`)
      .expect(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(2);
  });
});

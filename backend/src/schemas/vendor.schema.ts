import { z } from "zod";

export const createVendorProfileSchema = z.object({
  legalName: z.string().min(2).max(200),
  taxId: z.string().max(50).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  website: z.string().url().optional(),
});

export const updateVendorProfileSchema = createVendorProfileSchema.partial();

export const vendorStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
  rejectionReason: z.string().max(500).optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.enum([
    "trade_license",
    "vat_certificate",
    "iso_cert",
    "other",
  ]),
  fileUrl: z.string().url(),
  issuedDate: z.string().date().optional(),
  expiryDate: z.string().date().optional(),
});

export const addCategorySchema = z.object({
  categoryId: z.string().uuid(),
});

export type CreateVendorProfileInput = z.infer<
  typeof createVendorProfileSchema
>;
export type UpdateVendorProfileInput = z.infer<
  typeof updateVendorProfileSchema
>;
export type VendorStatusInput = z.infer<typeof vendorStatusSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type AddCategoryInput = z.infer<typeof addCategorySchema>;

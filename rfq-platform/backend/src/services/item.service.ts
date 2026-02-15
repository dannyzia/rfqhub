import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type { CreateItemInput, UpdateItemInput } from "../schemas/item.schema";

interface ItemRow {
  id: string;
  tender_id: string;
  parent_item_id: string | null;
  item_type: string;
  sl_no: number;
  item_code: string | null;
  item_name: string;
  specification: string | null;
  quantity: number;
  uom: string | null;
  estimated_cost: number | null;
  created_at: string;
}

interface ItemTree extends ItemRow {
  children: ItemTree[];
}

export const itemService = {
  async create(
    tenderId: string,
    input: CreateItemInput,
    orgId: string,
  ): Promise<ItemRow> {
    const tender = await pool.query(
      "SELECT status, buyer_org_id FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error("Tender not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (tender.rows[0].status !== "draft") {
      throw Object.assign(new Error("Can only add items to draft tenders"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    if (input.itemType === "group" && input.quantity !== 0) {
      throw Object.assign(new Error("Group items must have quantity 0"), {
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    }

    if (input.itemType === "item" && input.quantity <= 0) {
      throw Object.assign(new Error("Item quantity must be greater than 0"), {
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    }

    const id = uuidv4();

    const { rows } = await pool.query<ItemRow>(
      `INSERT INTO tender_items (
        id, tender_id, parent_item_id, item_type, sl_no, item_code,
        item_name, specification, quantity, uom, estimated_cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        tenderId,
        input.parentItemId || null,
        input.itemType,
        input.slNo,
        input.itemCode || null,
        input.itemName,
        input.specification || null,
        input.quantity,
        input.uom || null,
        input.estimatedCost || null,
      ],
    );

    logger.info(`Item created: ${id} in tender ${tenderId}`);
    return rows[0];
  },

  async findByTenderId(tenderId: string): Promise<ItemRow[]> {
    const { rows } = await pool.query<ItemRow>(
      "SELECT * FROM tender_items WHERE tender_id = $1 ORDER BY sl_no",
      [tenderId],
    );
    return rows;
  },

  async findByTenderIdAsTree(tenderId: string): Promise<ItemTree[]> {
    const items = await this.findByTenderId(tenderId);

    const itemMap = new Map<string, ItemTree>();
    const roots: ItemTree[] = [];

    for (const item of items) {
      itemMap.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      const node = itemMap.get(item.id)!;
      if (item.parent_item_id === null) {
        roots.push(node);
      } else {
        const parent = itemMap.get(item.parent_item_id);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    return roots;
  },

  async findById(tenderId: string, itemId: string): Promise<ItemRow | null> {
    const { rows } = await pool.query<ItemRow>(
      "SELECT * FROM tender_items WHERE id = $1 AND tender_id = $2",
      [itemId, tenderId],
    );
    return rows[0] || null;
  },

  async update(
    tenderId: string,
    itemId: string,
    input: UpdateItemInput,
    orgId: string,
  ): Promise<ItemRow> {
    const tender = await pool.query(
      "SELECT status, buyer_org_id FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error("Tender not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (tender.rows[0].status !== "draft") {
      throw Object.assign(new Error("Can only edit items in draft tenders"), {
        statusCode: 409,
        code: "CONFLICT",
      });
    }

    const item = await this.findById(tenderId, itemId);
    if (!item) {
      throw Object.assign(new Error("Item not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      itemType: "item_type",
      slNo: "sl_no",
      itemCode: "item_code",
      itemName: "item_name",
      specification: "specification",
      quantity: "quantity",
      uom: "uom",
      estimatedCost: "estimated_cost",
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in input) {
        updates.push(`${column} = $${paramIndex}`);
        values.push((input as Record<string, unknown>)[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return item;
    }

    values.push(itemId);

    const { rows } = await pool.query<ItemRow>(
      `UPDATE tender_items SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    logger.info(`Item updated: ${itemId} in tender ${tenderId}`);
    return rows[0];
  },

  async delete(tenderId: string, itemId: string, orgId: string): Promise<void> {
    const tender = await pool.query(
      "SELECT status, buyer_org_id FROM tenders WHERE id = $1",
      [tenderId],
    );

    if (tender.rows.length === 0) {
      throw Object.assign(new Error("Tender not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    if (tender.rows[0].buyer_org_id !== orgId) {
      throw Object.assign(new Error("Not authorized"), {
        statusCode: 403,
        code: "FORBIDDEN",
      });
    }

    if (tender.rows[0].status !== "draft") {
      throw Object.assign(
        new Error("Can only delete items from draft tenders"),
        {
          statusCode: 409,
          code: "CONFLICT",
        },
      );
    }

    await pool.query(
      "DELETE FROM tender_items WHERE id = $1 AND tender_id = $2",
      [itemId, tenderId],
    );

    logger.info(`Item deleted: ${itemId} from tender ${tenderId}`);
  },
};

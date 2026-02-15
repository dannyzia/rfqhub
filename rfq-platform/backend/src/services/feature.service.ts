import { v4 as uuidv4 } from "uuid";
import { pool, logger } from "../config";
import type {
  CreateFeatureInput,
  CreateOptionInput,
  AttachFeatureInput,
} from "../schemas/feature.schema";

interface FeatureRow {
  id: string;
  name: string;
  feature_type: string;
  scoring_type: string;
  evaluation_weight: number | null;
  is_global: boolean;
}

interface OptionRow {
  id: string;
  feature_id: string;
  option_value: string;
  option_score: number;
  sort_order: number;
}

interface ItemFeatureRow {
  tender_item_id: string;
  feature_id: string;
  is_mandatory: boolean;
}

export const featureService = {
  async createFeature(input: CreateFeatureInput): Promise<FeatureRow> {
    const id = uuidv4();

    const { rows } = await pool.query<FeatureRow>(
      `INSERT INTO feature_definitions (id, name, feature_type, scoring_type, evaluation_weight, is_global)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        input.name,
        input.featureType,
        input.scoringType,
        input.evaluationWeight || null,
        input.isGlobal,
      ],
    );

    logger.info(`Feature created: ${id} (${input.name})`);
    return rows[0];
  },

  async findFeatureById(id: string): Promise<FeatureRow | null> {
    const { rows } = await pool.query<FeatureRow>(
      "SELECT * FROM feature_definitions WHERE id = $1",
      [id],
    );
    return rows[0] || null;
  },

  async findAllGlobalFeatures(): Promise<FeatureRow[]> {
    const { rows } = await pool.query<FeatureRow>(
      "SELECT * FROM feature_definitions WHERE is_global = true ORDER BY name",
    );
    return rows;
  },

  async createOption(
    featureId: string,
    input: CreateOptionInput,
  ): Promise<OptionRow> {
    const feature = await this.findFeatureById(featureId);
    if (!feature) {
      throw Object.assign(new Error("Feature not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const id = uuidv4();

    const { rows } = await pool.query<OptionRow>(
      `INSERT INTO feature_options (id, feature_id, option_value, option_score, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, featureId, input.optionValue, input.optionScore, input.sortOrder],
    );

    logger.info(`Feature option created: ${id} for feature ${featureId}`);
    return rows[0];
  },

  async findOptionsByFeatureId(featureId: string): Promise<OptionRow[]> {
    const { rows } = await pool.query<OptionRow>(
      "SELECT * FROM feature_options WHERE feature_id = $1 ORDER BY sort_order",
      [featureId],
    );
    return rows;
  },

  async attachToItem(
    tenderId: string,
    itemId: string,
    input: AttachFeatureInput,
    orgId: string,
  ): Promise<ItemFeatureRow> {
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
        new Error("Can only attach features to items in draft tenders"),
        { statusCode: 409, code: "CONFLICT" },
      );
    }

    const item = await pool.query(
      "SELECT id FROM tender_items WHERE id = $1 AND tender_id = $2",
      [itemId, tenderId],
    );

    if (item.rows.length === 0) {
      throw Object.assign(new Error("Item not found"), {
        statusCode: 404,
        code: "NOT_FOUND",
      });
    }

    const { rows } = await pool.query<ItemFeatureRow>(
      `INSERT INTO tender_item_features (tender_item_id, feature_id, is_mandatory)
       VALUES ($1, $2, $3)
       ON CONFLICT (tender_item_id, feature_id) DO UPDATE SET is_mandatory = $3
       RETURNING *`,
      [itemId, input.featureId, input.isMandatory],
    );

    logger.info(`Feature attached to item: ${itemId} -> ${input.featureId}`);
    return rows[0];
  },

  async findFeaturesByItemId(
    itemId: string,
  ): Promise<(FeatureRow & { is_mandatory: boolean; options: OptionRow[] })[]> {
    const { rows: attachments } = await pool.query<ItemFeatureRow & FeatureRow>(
      `SELECT tif.*, fd.*
       FROM tender_item_features tif
       JOIN feature_definitions fd ON fd.id = tif.feature_id
       WHERE tif.tender_item_id = $1`,
      [itemId],
    );

    const result = [];
    for (const att of attachments) {
      const options = await this.findOptionsByFeatureId(att.feature_id);
      result.push({
        id: att.feature_id,
        name: att.name,
        feature_type: att.feature_type,
        scoring_type: att.scoring_type,
        evaluation_weight: att.evaluation_weight,
        is_global: att.is_global,
        is_mandatory: att.is_mandatory,
        options,
      });
    }

    return result;
  },

  async detachFromItem(
    tenderId: string,
    itemId: string,
    featureId: string,
    orgId: string,
  ): Promise<void> {
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
        new Error("Can only detach features from items in draft tenders"),
        { statusCode: 409, code: "CONFLICT" },
      );
    }

    await pool.query(
      "DELETE FROM tender_item_features WHERE tender_item_id = $1 AND feature_id = $2",
      [itemId, featureId],
    );

    logger.info(`Feature detached from item: ${itemId} <- ${featureId}`);
  },
};

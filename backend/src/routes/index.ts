
import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { tenderRoutes } from "./tender.routes";
import { featureRoutes } from "./feature.routes";
import { vendorRoutes } from "./vendor.routes";
import { bidRoutes } from "./bid.routes";
import { evaluationRoutes } from "./evaluation.routes";
import { notificationRoutes } from "./notification.routes";
import { adminRoutes } from "./admin.routes";
import { exportRoutes } from "./export.routes";
import tenderTypeRoutes from "./tenderType.routes";
import documentChecklistRoutes from "./documentChecklist.routes";
import simpleRfqRoutes from "./simpleRfq.routes";

const router = Router();


router.use("/auth", authRoutes);
router.use("/tender-types", tenderTypeRoutes);
router.use("/tenders", tenderRoutes);
router.use("/tenders", simpleRfqRoutes);
router.use("/tenders", documentChecklistRoutes);
router.use("/features", featureRoutes);
router.use("/vendors", vendorRoutes);
router.use("/", bidRoutes);
router.use("/", evaluationRoutes);
router.use("/", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/", exportRoutes);

export { router as apiRoutes };

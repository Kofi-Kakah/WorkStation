import { Router } from "express";
import health from "./health.js";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = Router();

router.use(health);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Later sections mount their module routers here:
// router.use('/projects', projectRoutes);
// router.use('/channels', channelRoutes);
// router.use('/messages', messageRoutes);
// router.use('/boards', boardRoutes);
// router.use('/issues', issueRoutes);
// router.use('/integrations', integrationRoutes);
// router.use('/activities', activityRoutes);

export default router;

import agent from "@convex-dev/agent/convex.config";
import workpool from "@convex-dev/workpool/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(agent);
app.use(workpool, { name: "documentProcessing" });

export default app;

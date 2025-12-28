import { logger } from "@vendetta";
import Settings from "./settings";

export default {
  onLoad() {
    logger.log("HypeSquad plugin loaded");
  },
  onUnload() {
    logger.log("HypeSquad plugin unloaded");
  },
  settings: Settings,
};

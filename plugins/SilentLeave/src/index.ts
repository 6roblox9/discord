import { metro } from "@vendetta";
import { instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings";

const API = metro.findByProps("request", "getAPIBaseURL");
let patches = [];

export default {
  onLoad() {
    storage.logs ??= [];
    storage.logs.unshift(`[${new Date().toLocaleTimeString()}] Silent Leave Loaded`);

    if (!API?.request) {
      storage.logs.unshift("[ERROR] API.request not found");
      return;
    }

    patches.push(
      instead("request", API, (args, orig) => {
        const [options] = args;

        if (
          options?.method === "DELETE" &&
          typeof options.url === "string" &&
          options.url.startsWith("/channels/")
        ) {
          if (!options.url.includes("silent=true")) {
            options.url += options.url.includes("?")
              ? "&silent=true"
              : "?silent=true";

            storage.logs.unshift(
              `[${new Date().toLocaleTimeString()}] Patched DELETE ${options.url}`
            );
          }
        }

        return orig(...args);
      })
    );
  },

  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },

  settings: Settings
};


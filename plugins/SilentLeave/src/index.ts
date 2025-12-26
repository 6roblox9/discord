import { instead } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import Settings from "./Settings";

let patches = [];

export default {
  onLoad() {
    storage.logs ??= [];
    storage.logs.unshift(`[${new Date().toLocaleTimeString()}] Silent Leave Loaded`);

    if (typeof fetch !== "function") {
      storage.logs.unshift("[ERROR] fetch not found");
      return;
    }

    patches.push(
      instead("fetch", globalThis, (args, orig) => {
        let [url, options] = args;

        if (
          typeof url === "string" &&
          options?.method === "DELETE" &&
          url.includes("/channels/")
        ) {
          if (!url.includes("silent=true")) {
            url = url.replace("silent=false", "silent=true");
            if (!url.includes("silent=")) {
              url += url.includes("?") ? "&silent=true" : "?silent=true";
            }

            storage.logs.unshift(
              `[${new Date().toLocaleTimeString()}] Patched FETCH ${url}`
            );
          }

          return orig(url, options);
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


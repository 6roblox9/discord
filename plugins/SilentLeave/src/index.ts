import { findByProps } from '@vendetta/metro';
import { instead } from '@vendetta/patcher';

const HTTP = findByProps("del", "get", "post");

let unpatch: () => void;

export default {
  onLoad: () => {
    unpatch = instead("del", HTTP, (args, orig) => {
      let url = args[0]?.url || args[0];

      if (typeof url === "string" && url.includes("/channels/") && !url.includes("silent=true")) {
        const separator = url.includes("?") ? "&" : "?";
        const newUrl = `${url}${separator}silent=true`;

        if (args[0]?.url) {
          args[0].url = newUrl;
        } else {
          args[0] = newUrl;
        }
      }
      
      return orig(...args);
    });
  },
  onUnload: () => {
    if (unpatch) unpatch();
  }
};

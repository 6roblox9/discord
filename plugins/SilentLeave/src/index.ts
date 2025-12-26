import { findByProps } from '@vendetta/metro';
import { instead } from '@vendetta/patcher';

const HTTP = findByProps("del", "put", "post");

let unpatch: () => void;

export default {
  onLoad: () => {
    unpatch = instead("del", HTTP, (args, orig) => {
      const request = args[0];
      let url = typeof request === "string" ? request : request?.url;

      if (typeof url === "string" && url.includes("/channels/") && !url.includes("silent=true")) {
        const separator = url.includes("?") ? "&" : "?";
        const newUrl = `${url}${separator}silent=true`;

        if (typeof request === "string") {
          args[0] = newUrl;
        } else if (request?.url) {
          request.url = newUrl;
        }
      }

      return orig(...args);
    });
  },
  onUnload: () => {
    if (unpatch) unpatch();
  }
};

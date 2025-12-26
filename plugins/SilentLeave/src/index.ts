import { findByProps } from '@vendetta/metro';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const HTTP = findByProps("del", "put", "post");
let unpatch: () => void;

export default {
    onLoad: () => {
        storage.logs ??= [];

        unpatch = instead("del", HTTP, (args, orig) => {
            const request = args[0];
            let url = typeof request === "string" ? request : request?.url;

            if (typeof url === "string" && url.includes("/channels/")) {
                const timestamp = new Date().toLocaleTimeString();
                storage.logs.unshift(`[${timestamp}] REQ: ${url}`);
                if (storage.logs.length > 20) storage.logs.pop();

                if (!url.includes("silent=true")) {
                    const separator = url.includes("?") ? "&" : "?";
                    const newUrl = `${url}${separator}silent=true`;

                    if (typeof request === "string") {
                        args[0] = newUrl;
                    } else if (request?.url) {
                        request.url = newUrl;
                    }
                    storage.logs.unshift(`[${timestamp}] MOD: Added silent=true`);
                }
            }
            return orig(...args);
        });
    },
    onUnload: () => {
        if (unpatch) unpatch();
    },
    settings: Settings,
}

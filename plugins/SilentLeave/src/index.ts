import { findByProps } from '@vendetta/metro';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const HTTP = findByProps("del", "put", "post");
let unpatch: () => void;

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Monitoring URL: silent=false -> true`);

        unpatch = instead("del", HTTP, (args, orig) => {
            const request = args[0];
            let url = typeof request === "string" ? request : request?.url;

            if (typeof url === "string" && url.includes("/channels/")) {
                const time = new Date().toLocaleTimeString();
                
                if (url.includes("silent=false")) {
                    const newUrl = url.replace("silent=false", "silent=true");
                    
                    storage.logs.unshift(`[${time}] MATCH: Changing false to true`);
                    
                    if (typeof request === "string") {
                        args[0] = newUrl;
                    } else if (request?.url) {
                        request.url = newUrl;
                    }
                } else if (!url.includes("silent=")) {
                    const separator = url.includes("?") ? "&" : "?";
                    const newUrl = `${url}${separator}silent=true`;
                    
                    storage.logs.unshift(`[${time}] MISSING: Adding silent=true`);

                    if (typeof request === "string") {
                        args[0] = newUrl;
                    } else if (request?.url) {
                        request.url = newUrl;
                    }
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

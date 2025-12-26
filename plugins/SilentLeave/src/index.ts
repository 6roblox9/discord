import { findByProps } from '@vendetta/metro';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const HTTP = findByProps("del", "put", "post");
const REST = findByProps("delete", "patch", "post");
const Agent = findByProps("delete", "put");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Plugin Started - Monitoring...`);

        const handleRequest = (args, orig, method) => {
            const request = args[0];
            let url = typeof request === "string" ? request : request?.url;

            if (typeof url === "string" && url.includes("/channels/")) {
                storage.logs.unshift(`[${timestamp}] ${method} DETECTED: ${url}`);
                if (storage.logs.length > 30) storage.logs.pop();

                if (!url.includes("silent=true")) {
                    const separator = url.includes("?") ? "&" : "?";
                    const newUrl = `${url}${separator}silent=true`;
                    if (typeof request === "string") {
                        args[0] = newUrl;
                    } else if (request?.url) {
                        request.url = newUrl;
                    }
                    storage.logs.unshift(`[${timestamp}] MODIFIED: Added silent=true`);
                }
            }
            return orig(...args);
        };

        if (HTTP?.del) patches.push(instead("del", HTTP, (args, orig) => handleRequest(args, orig, "HTTP")));
        if (REST?.delete) patches.push(instead("delete", REST, (args, orig) => handleRequest(args, orig, "REST")));
        if (Agent?.delete) patches.push(instead("delete", Agent, (args, orig) => handleRequest(args, orig, "Agent")));
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}

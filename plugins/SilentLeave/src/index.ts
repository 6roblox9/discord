import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const HTTP = metro.findByProps("get", "post", "del") || metro.findByProps("delete", "patch");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        storage.logs.unshift(`[${new Date().toLocaleTimeString()}] HTTP Interceptor Ready`);

        if (HTTP) {
            const method = HTTP.del ? "del" : "delete";
            
            patches.push(instead(method, HTTP, (args, orig) => {
                let request = args[0];
                let url = typeof request === 'string' ? request : request?.url;

                if (url && url.includes("/channels/")) {
                    const time = new Date().toLocaleTimeString();
                    
                    if (typeof request === 'string') {
                        if (url.includes("silent=false")) {
                            args[0] = url.replace("silent=false", "silent=true");
                        } else if (!url.includes("silent=")) {
                            args[0] = url.includes("?") ? `${url}&silent=true` : `${url}?silent=true`;
                        }
                    } else {
                        if (request.query) {
                            request.query.silent = "true";
                        } else {
                            request.url = url.includes("?") ? `${url}&silent=true` : `${url}?silent=true`;
                        }
                    }
                    
                    storage.logs.unshift(`[${time}] ⚡ FORCE SILENT: ${url.split('/').pop()}`);
                }
                
                return orig(...args);
            }));
        } else {
            storage.logs.unshift(`[ERROR] HTTP Module NOT Found`);
        }
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}


import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const RequestModule = metro.findByProps("get", "post", "del") || 
                      metro.findByProps("put", "delete", "post") ||
                      metro.find(m => m.delete && m.getAPIBaseURL);

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Revenge Sniper Started`);

        if (RequestModule) {
            storage.logs.unshift(`[OK] Found Request Module`);
            
            const methods = ["delete", "del"];
            methods.forEach(method => {
                if (typeof RequestModule[method] === "function") {
                    patches.push(instead(method, RequestModule, (args, orig) => {
                        const time = new Date().toLocaleTimeString();
                        let url = "";

                        if (typeof args[0] === "string") {
                            url = args[0];
                        } else if (args[0]?.url) {
                            url = args[0].url;
                        }

                        if (url.includes("/channels/")) {
                            storage.logs.unshift(`[${time}] INTERCEPTED: ${url}`);
                            
                            if (url.includes("silent=false")) {
                                args[0] = typeof args[0] === "string" 
                                    ? url.replace("silent=false", "silent=true")
                                    : { ...args[0], url: url.replace("silent=false", "silent=true") };
                                storage.logs.unshift(`[${time}] MODIFIED TO SILENT`);
                            }
                        }

                        return orig(...args);
                    }));
                }
            });
        } else {
            storage.logs.unshift(`[FAIL] Could not find HTTP module`);
        }
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}


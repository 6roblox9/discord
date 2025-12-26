import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const REST = metro.findByProps("get", "post", "delete", "request");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Sniper Started - Monitoring DELETE requests`);

        if (REST) {
            const methodNames = ["delete", "del"];

            methodNames.forEach(method => {
                if (typeof REST[method] === "function") {
                    patches.push(instead(method, REST, (args, orig) => {
                        const time = new Date().toLocaleTimeString();
                        let url = "Unknown URL";

                        if (typeof args[0] === 'string') {
                            url = args[0];
                        } else if (typeof args[0] === 'object' && args[0].url) {
                            url = args[0].url;
                        } else if (args[1] && typeof args[1] === 'string') {
                            url = args[1];
                        }

                        storage.logs.unshift(`[${time}] DELETE DETECTED: ${url}`);
                        
                        return orig(...args);
                    }));
                }
            });
            
            if (typeof REST.request === "function") {
                patches.push(instead("request", REST, (args, orig) => {
                    const config = args[0];
                    if (config && (config.method === "delete" || config.method === "DELETE")) {
                        const time = new Date().toLocaleTimeString();
                        storage.logs.unshift(`[${time}] REQUEST-DEL: ${config.url || "no-url"}`);
                    }
                    return orig(...args);
                }));
            }
        } else {
            storage.logs.unshift(`[Error] REST Module NOT found`);
        }
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}


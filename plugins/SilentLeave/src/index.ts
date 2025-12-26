import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const HTTP = metro.findByProps("get", "post", "put", "del");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Monitor Started`);

        if (HTTP) {
            patches.push(instead("del", HTTP, (args, orig) => {
                let url = args[0];

                if (typeof url === 'string' && url.includes("/channels/") && url.includes("silent=false")) {
                    args[0] = url.replace("silent=false", "silent=true");
                    
                    const time = new Date().toLocaleTimeString();
                    storage.logs.unshift(`[${time}] Switched to silent=true`);
                }

                return orig(...args);
            }));
        }
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}

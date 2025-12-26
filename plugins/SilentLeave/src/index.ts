import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const FluxDispatcher = metro.findByProps("dispatch", "subscribe");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Dispatch Sniper Started`);

        if (FluxDispatcher) {
            patches.push(instead("dispatch", FluxDispatcher, (args, orig) => {
                const action = args[0];

                if (action && (action.type === "LEAVE_GROUP_DM" || action.type === "DELETE_CHANNEL")) {
                    const time = new Date().toLocaleTimeString();
                    
                    action.silent = true;
                    
                    storage.logs.unshift(`[${time}] Patched Action: ${action.type} (Set silent=true)`);
                    
                    if (action.channelId) {
                        storage.logs.unshift(`[DEBUG] Target Channel: ${action.channelId}`);
                    }
                }

                return orig(...args);
            }));
        } else {
            storage.logs.unshift(`[Error] FluxDispatcher not found`);
        }
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}


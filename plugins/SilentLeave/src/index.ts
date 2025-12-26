import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const ChannelAPI = metro.findByProps("deleteChannel");
const Dispatcher = metro.findByProps("dispatch", "subscribe");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Logic Switch: API Hooking Started`);

        if (ChannelAPI) {
            patches.push(instead("deleteChannel", ChannelAPI, (args, orig) => {
                const time = new Date().toLocaleTimeString();
                const channelId = args[0];
                const silent = args[1];

                storage.logs.unshift(`[${time}] API: deleteChannel for ${channelId}`);

                if (silent !== true) {
                    args[1] = true; 
                    storage.logs.unshift(`[${time}] SUCCESS: Forced silent flag in API`);
                }
                
                return orig(...args);
            }));
        }

        if (Dispatcher) {
            patches.push(instead("dispatch", Dispatcher, (args, orig) => {
                const action = args[0];
                if (action.type === "CHANNEL_DELETE") {
                    action.silent = true;
                    storage.logs.unshift(`[${new Date().toLocaleTimeString()}] Dispatcher: Set action.silent`);
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

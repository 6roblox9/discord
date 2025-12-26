import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const ChannelActions = metro.findByProps("closePrivateChannel", "leaveGroupDM");
const Dispatcher = metro.findByProps("dispatch", "subscribe");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Advanced Monitor Started`);

        if (ChannelActions) {
            patches.push(instead("closePrivateChannel", ChannelActions, (args, orig) => {
                const time = new Date().toLocaleTimeString();
                storage.logs.unshift(`[${time}] Intercepted: closePrivateChannel`);
                
                if (args[1] !== true) {
                    args[1] = true; 
                    storage.logs.unshift(`[${time}] Success: Set silent=true (Arg)`);
                }
                return orig(...args);
            }));
        }

        if (Dispatcher) {
            patches.push(instead("dispatch", Dispatcher, (args, orig) => {
                const action = args[0];
                if (action.type === "CHANNEL_DELETE" || action.type === "LEAVE_GROUP_DM") {
                    const time = new Date().toLocaleTimeString();
                    storage.logs.unshift(`[${time}] Dispatcher: ${action.type}`);
                    action.silent = true;
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

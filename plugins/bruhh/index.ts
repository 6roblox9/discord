import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { logger } from "@vendetta";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");

let unpatchPatch: (() => void) | null = null;

export default {
    onLoad() {
        unpatchPatch = instead("patch", RestAPI, async (args, orig) => {
            const req = args[0];
            const urlMatch = req.url?.match(/^\/channels\/(\d+)\/messages\/(\d+)$/);
            
            if (urlMatch) {
                const channelId = urlMatch[1];
                const messageId = urlMatch[2];
                
                try {
                    const response = await RestAPI.post({
                        url: `/channels/${channelId}/messages`,
                        body: {
                            content: req.body.content,
                            flags: 4096,
                            mobile_network_type: "unknown",
                            nonce: messageId,
                            tts: false,
                        }
                    });
                    
                    showToast("Silent Edit Success!");
                    return response; 
                } catch (err: any) {
                    const errorDetails = err?.body ? JSON.stringify(err.body) : String(err);
                    showToast("Error: " + errorDetails);
                    return { status: 400, body: err };
                }
            }

            return orig(...args);
        });
    },

    onUnload() {
        unpatchPatch?.();
        unpatchPatch = null;
    },
};

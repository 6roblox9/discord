import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { logger } from "@vendetta";

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
                    
                    logger.log("[SilentEdit] Successfully hijacked Edit and performed Silent Edit!");
                    return response; 
                } catch (err) {
                    logger.warn("[SilentEdit] Exploit failed, falling back to normal Edit: " + String(err));
                    return orig(...args);
                }
            }

            return orig(...args);
        });

        logger.log("[SilentEdit] Loaded successfully.");
    },

    onUnload() {
        unpatchPatch?.();
        unpatchPatch = null;
        logger.log("[SilentEdit] Unloaded.");
    },
};

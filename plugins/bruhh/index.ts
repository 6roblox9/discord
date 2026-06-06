import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageStore = findByProps("getMessage", "getMessages");

let unpatchPatch: (() => void) | null = null;

export default {
    onLoad() {
        unpatchPatch = instead("patch", RestAPI, async (args, orig) => {
            let reqUrl = "";
            let reqBody: any = {};
            
            if (args[0] && typeof args[0] === "string") {
                reqUrl = args[0];
                reqBody = args[1]?.body ?? args[1] ?? {};
            } else if (args[0] && typeof args[0] === "object") {
                reqUrl = args[0].url ?? "";
                reqBody = args[0].body ?? {};
            }

            if (typeof reqBody === "string") {
                try { reqBody = JSON.parse(reqBody); } catch (e) {}
            }

            const urlMatch = reqUrl.match(/\/channels\/(\d+)\/messages\/(\d+)/);
            
            if (urlMatch) {
                const channelId = urlMatch[1];
                const messageId = urlMatch[2];
                
                try {
                    const rawMsg = MessageStore?.getMessage(channelId, messageId);
                    
                    if (rawMsg?.attachments && rawMsg.attachments.length > 0) {
                        showToast("Media detected: Falling back to normal edit.");
                        return orig(...args);
                    }

                    const body: any = {
                        content: reqBody.content,
                        nonce: messageId,
                        flags: rawMsg?.flags ?? 0,
                        mobile_network_type: "unknown",
                        tts: rawMsg?.tts ?? false
                    };

                    const ref = rawMsg?.messageReference || rawMsg?.message_reference;
                    if (ref) {
                        body.message_reference = {
                            message_id: ref.message_id || ref.messageId,
                            channel_id: ref.channel_id || ref.channelId,
                            guild_id: ref.guild_id || ref.guildId,
                        };
                    }

                    const response = await RestAPI.post({
                        url: `/channels/${channelId}/messages`,
                        body: body
                    });
                    
                    if (response && response.body) {
                        response.body.id = messageId;
                    }
                    
                    showToast("Silent Edit Success!");
                    return response; 
                } catch (err: any) {
                    const errorMsg = err?.body ? JSON.stringify(err.body) : String(err);
                    showToast("API Error: " + errorMsg);
                    throw err;
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

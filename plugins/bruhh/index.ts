import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageActions = findByProps("editMessage");
const MessageStore = findByProps("getMessage", "getMessages");

let unpatchEditMessage: (() => void) | null = null;

function toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase);
    } else if (obj !== null && typeof obj === "object") {
        const n: any = {};
        for (const k of Object.keys(obj)) {
            const sk = k.replace(/([A-Z])/g, "_$1").toLowerCase();
            n[sk] = toSnakeCase(obj[k]);
        }
        return n;
    }
    return obj;
}

export default {
    onLoad() {
        unpatchEditMessage = instead("editMessage", MessageActions, async (args, orig) => {
            const [channelId, messageId, reqData] = args;

            try {
                const rawMsg = MessageStore?.getMessage(channelId, messageId);
                
                if (!rawMsg) {
                    return;
                }

                const body: any = {
                    content: reqData.content,
                    nonce: messageId,
                    flags: rawMsg.flags ?? 0,
                    mobile_network_type: "unknown",
                    tts: rawMsg.tts ?? false
                };

                if (rawMsg.attachments) {
                    body.attachments = toSnakeCase(rawMsg.attachments);
                }
                if (rawMsg.embeds) {
                    body.embeds = toSnakeCase(rawMsg.embeds);
                }
                if (rawMsg.components) {
                    body.components = toSnakeCase(rawMsg.components);
                }

                const ref = rawMsg.messageReference || rawMsg.message_reference;
                if (ref) {
                    body.message_reference = toSnakeCase(ref);
                }

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body: body
                });
                
                return response;
            } catch (err: any) {
                const errorMsg = err?.body ? JSON.stringify(err.body) : String(err);
                showToast("Error: " + errorMsg);
                return;
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

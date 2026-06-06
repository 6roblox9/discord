import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageActions = findByProps("editMessage");
const MessageStore = findByProps("getMessage", "getMessages");

let unpatchEditMessage: (() => void) | null = null;

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
                    flags: 0,
                    mobile_network_type: "unknown",
                    tts: false
                };

                if (rawMsg.messageReference) {
                    body.message_reference = {
                        message_id: rawMsg.messageReference.message_id || rawMsg.messageReference.messageId,
                        channel_id: rawMsg.messageReference.channel_id || rawMsg.messageReference.channelId,
                        guild_id: rawMsg.messageReference.guild_id || rawMsg.messageReference.guildId,
                    };
                }

                if (rawMsg.attachments && rawMsg.attachments.length > 0) {
                    body.attachments = rawMsg.attachments.map((a: any) => ({
                        id: a.id,
                        filename: a.filename,
                        description: a.description
                    }));
                }

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body: body
                });
                
                return response;
            } catch (err: any) {
                const errorMsg = err?.body ? JSON.stringify(err.body) : String(err);
                showToast("Fake Edit Error: " + errorMsg);
                return;
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

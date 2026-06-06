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
                let rawMsg = MessageStore?.getMessage(channelId, messageId);
                
                if (!rawMsg) {
                    const res = await RestAPI.get({ url: `/channels/${channelId}/messages?limit=1&around=${messageId}` });
                    if (res.body && res.body.length > 0) {
                        rawMsg = res.body[0];
                    }
                }

                if (!rawMsg) {
                    showToast("Error: Message not found");
                    return;
                }

                const body: any = {
                    content: reqData.content,
                    nonce: messageId,
                    flags: rawMsg.flags ?? 0,
                    mobile_network_type: "unknown",
                    tts: rawMsg.tts ?? false
                };

                const ref = rawMsg.messageReference || rawMsg.message_reference;
                if (ref) {
                    body.message_reference = {
                        message_id: ref.message_id || ref.messageId,
                        channel_id: ref.channel_id || ref.channelId,
                        guild_id: ref.guild_id || ref.guildId,
                    };
                }

                if (rawMsg.attachments && rawMsg.attachments.length > 0) {
                    body.attachments = rawMsg.attachments.map((a: any, index: number) => {
                        let uploadedFilename = "";
                        if (a.url) {
                            const match = a.url.match(/\/attachments\/(.+?)(?:\?|$)/);
                            if (match) {
                                uploadedFilename = match[1];
                            }
                        }
                        return {
                            id: String(index),
                            filename: a.filename,
                            uploaded_filename: uploadedFilename
                        };
                    });
                }

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body: body
                });
                
                return response;
            } catch (err: any) {
                const errorMsg = err?.body ? JSON.stringify(err.body) : String(err);
                showToast("API Error: " + errorMsg);
                return;
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

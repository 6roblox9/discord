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
                    showToast("Fetching from API...");
                    const res = await RestAPI.get({ url: `/channels/${channelId}/messages/${messageId}` });
                    rawMsg = res.body;
                }

                if (!rawMsg) {
                    showToast("Error: Message not found at all");
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
                    body.attachments = rawMsg.attachments.map((a: any) => {
                        let uploadedFilename = "";
                        if (a.url) {
                            const match = a.url.match(/\/attachments\/(.+?)(?:\?|$)/);
                            if (match) {
                                uploadedFilename = match[1];
                            }
                        }
                        return {
                            id: a.id || "0",
                            filename: a.filename,
                            uploaded_filename: uploadedFilename
                        };
                    });
                }

                showToast("Sending Payload...");

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body: body
                });
                
                showToast("Silent Edit Success!");
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

import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageActions = findByProps("editMessage");

let unpatchEditMessage: (() => void) | null = null;

export default {
    onLoad() {
        unpatchEditMessage = instead("editMessage", MessageActions, async (args, orig) => {
            const [channelId, messageId, reqData] = args;

            try {
                const originalMessage = await RestAPI.get({
                    url: `/channels/${channelId}/messages`,
                    query: { limit: 1, around: messageId },
                });

                const msgArray = originalMessage?.body;
                if (!msgArray || !msgArray.length) return orig(...args);

                const msg = msgArray.find((m: any) => m.id === messageId);
                if (!msg) return orig(...args);

                let content = reqData.content;
                const attachmentMatch = content.match(/\.filename\s+(\S+)/);
                let attachments;

                if (attachmentMatch) {
                    content = content.replace(/\.filename\s+\S+/, "").trim();
                    const uploadedFilename = attachmentMatch[1];
                    const filename = uploadedFilename.split("/").pop();
                    
                    attachments = [
                        {
                            id: "0",
                            filename: filename,
                            uploaded_filename: uploadedFilename,
                        },
                    ];
                }

                const body: any = {
                    content: content,
                    nonce: messageId,
                    tts: false,
                    flags: msg.flags ?? 0,
                    mobile_network_type: "wifi",
                };

                if (attachments) {
                    body.attachments = attachments;
                }

                if (msg.message_reference) {
                    body.message_reference = {
                        message_id: msg.message_reference.message_id,
                        channel_id: msg.message_reference.channel_id,
                        guild_id: msg.message_reference.guild_id,
                    };
                    
                    const repliedUserId = msg.message_reference.message_id;
                    const hasPing = msg.mentions?.some((m: any) => m.id === repliedUserId);
                    
                    if (hasPing) {
                        body.allowed_mentions = {
                            replied_user: true,
                        };
                    }
                }

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body,
                });

                return response;
            } catch (err: any) {
                showToast("Error: " + (err?.body?.message || err?.message || String(err)));
                return orig(...args);
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

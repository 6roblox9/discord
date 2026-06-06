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

                showToast(JSON.stringify(msg.attachments));

                const body: any = {
                    content: reqData.content,
                    nonce: messageId,
                    tts: false,
                    flags: msg.flags ?? 0,
                    mobile_network_type: "unknown",
                };

                if (msg.message_reference) {
                    body.message_reference = {
                        message_id: msg.message_reference.message_id,
                        channel_id: msg.message_reference.channel_id,
                        guild_id: msg.message_reference.guild_id,
                    };

                    const repliedUserMentioned = msg.mentions?.some(
                        (m: any) => m.id === msg.message_reference.message_id
                    );
                    body.allowed_mentions = {
                        replied_user: !!repliedUserMentioned,
                    };
                }

                if (msg.attachments && msg.attachments.length > 0) {
                    body.attachments = msg.attachments.map((att: any) => ({
                        id: "0",
                        filename: att.filename,
                        uploaded_filename: "tmp",
                    }));
                }

                if (msg.sticker_items && msg.sticker_items.length > 0) {
                    body.sticker_ids = msg.sticker_items.map((s: any) => s.id);
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

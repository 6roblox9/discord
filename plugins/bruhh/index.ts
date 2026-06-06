import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageActions = findByProps("editMessage");
const MessageStore = findByProps("getMessage", "getMessages");

let unpatchEditMessage: (() => void) | null = null;

export default {
    onLoad() {
        unpatchEditMessage = instead("editMessage", MessageActions, async (args, orig) => {
            const [channelId, messageId, reqData] = args;

            const originalMessage = MessageStore.getMessage(channelId, messageId);

            if (!originalMessage) {
                return orig(...args);
            }

            try {
                const newMessageData: any = {
                    mobile_network_type: "unknown",
                    content: reqData.content,
                    nonce: messageId,
                    tts: false,
                    flags: originalMessage.flags || 0,
                };

                if (originalMessage.messageReference || originalMessage.message_reference) {
                    const ref = originalMessage.messageReference || originalMessage.message_reference;
                    newMessageData.message_reference = {
                        message_id: ref.messageId || ref.message_id,
                        channel_id: ref.channelId || ref.channel_id,
                        guild_id: ref.guildId || ref.guild_id,
                    };
                }

                if (originalMessage.attachments && originalMessage.attachments.length > 0) {
                    newMessageData.attachments = originalMessage.attachments.map((att: any) => ({
                        id: att.id,
                        filename: att.filename,
                    }));
                }

                if (originalMessage.stickerIds || originalMessage.sticker_ids) {
                    newMessageData.sticker_ids = originalMessage.stickerIds || originalMessage.sticker_ids;
                }

                if (originalMessage.embeds && originalMessage.embeds.length > 0) {
                    newMessageData.embeds = originalMessage.embeds;
                }

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body: newMessageData,
                });

                return response;
            } catch (err: any) {
                return orig(...args);
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

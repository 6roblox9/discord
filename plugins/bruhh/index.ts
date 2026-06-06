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

            try {
                const origMsg = MessageStore?.getMessage(channelId, messageId);
                const body: any = {
                    content: reqData.content,
                    flags: 0,
                    mobile_network_type: "unknown",
                    nonce: messageId,
                    tts: false,
                };

                if (origMsg?.messageReference) {
                    const ref = origMsg.messageReference;
                    body.message_reference = {
                        message_id: ref.message_id || ref.messageId,
                        channel_id: ref.channel_id || ref.channelId,
                        guild_id: ref.guild_id || ref.guildId,
                    };
                }

                if (origMsg?.attachments && origMsg.attachments.length > 0) {
                    body.attachments = origMsg.attachments.map((a: any) => ({
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
                return orig(...args);
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

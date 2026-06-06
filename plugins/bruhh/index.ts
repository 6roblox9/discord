import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageActions = findByProps("editMessage");

let unpatchEditMessage: (() => void) | null = null;

export default {
    onLoad() {
        unpatchEditMessage = instead("editMessage", MessageActions, async (args, orig) => {
            const [channelId, messageId, reqData] = args;

            try {
                const res = await RestAPI.get({ url: `/channels/${channelId}/messages/${messageId}` });
                const rawMsg = res.body;

                const body: any = {
                    content: reqData.content,
                    flags: 0,
                    mobile_network_type: "unknown",
                    nonce: messageId,
                    tts: false,
                };

                if (rawMsg.attachments) body.attachments = rawMsg.attachments;
                if (rawMsg.embeds) body.embeds = rawMsg.embeds;
                if (rawMsg.components) body.components = rawMsg.components;
                if (rawMsg.message_reference) body.message_reference = rawMsg.message_reference;

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

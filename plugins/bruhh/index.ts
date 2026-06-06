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
                const rawMsg = MessageStore?.getMessage(channelId, messageId);
                
                if (!rawMsg) {
                    return orig(...args);
                }

                const body: any = JSON.parse(JSON.stringify(rawMsg));

                body.content = reqData.content;
                body.nonce = messageId;
                body.mobile_network_type = "unknown";

                if (rawMsg.messageReference) {
                    body.message_reference = rawMsg.messageReference;
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

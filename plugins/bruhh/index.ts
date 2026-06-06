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
                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body: {
                        content: reqData.content,
                        flags: 0,
                        mobile_network_type: "unknown",
                        nonce: messageId,
                        tts: false,
                    }
                });
                showToast("Fake Edit Success!");
                return response;
            } catch (err: any) {
                showToast("Error: " + (err?.body ? JSON.stringify(err.body) : String(err)));
                return orig(...args);
            }
        });
    },

    onUnload() {
        unpatchEditMessage?.();
        unpatchEditMessage = null;
    },
};

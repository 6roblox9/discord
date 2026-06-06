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
                const message = MessageStore.getMessage(channelId, messageId);
                
                const body: any = {
                    content: reqData.content,
                    flags: 0,
                    mobile_network_type: "unknown",
                    nonce: messageId,
                    tts: false,
                };

                if (message) {
                    if (message.messageReference) {
                        body.message_reference = {
                            guild_id: message.messageReference.guild_id,
                            channel_id: message.messageReference.channel_id,
                            message_id: message.messageReference.message_id,
                        };
                    }

                    if (message.attachments?.length > 0) {
                        body.attachments = message.attachments.map((att: any) => ({
                            id: att.id,
                            filename: att.filename,
                            size: att.size,
                            url: att.url,
                            proxy_url: att.proxy_url,
                            width: att.width,
                            height: att.height,
                            content_type: att.content_type,
                            content_scan_version: att.content_scan_version,
                            placeholder: att.placeholder,
                            placeholder_version: att.placeholder_version,
                            spoiler: att.spoiler,
                        }));
                    }

                    if (message.stickerItems?.length > 0) {
                        body.sticker_ids = message.stickerItems.map((s: any) => s.id);
                    }
                }

                const response = await RestAPI.post({
                    url: `/channels/${channelId}/messages`,
                    body,
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

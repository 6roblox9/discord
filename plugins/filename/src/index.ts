import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
import { clipboard } from "@vendetta/metro/common";

const MessageActions = findByProps("sendMessage", "editMessage");

let unpatchSendMessage: (() => void) | null = null;

export default {
    onLoad() {
        if (!MessageActions || !MessageActions.sendMessage) return;

        unpatchSendMessage = instead("sendMessage", MessageActions, (args, orig) => {
            const [channelId, messageData] = args;

            if (messageData && messageData.content === ".") {
                const attachments = messageData.attachments || messageData.fileUploads;

                if (attachments && attachments.length > 0) {
                    const slicedAttachments = attachments.slice(0, 10);
                    
                    const clipboardText = slicedAttachments.map((attachment: any) => {
                        const uploadedFilename = attachment.uploaded_filename || attachment.filename;
                        return `.filename ${uploadedFilename}`;
                    }).join("\n");

                    clipboard.setString(clipboardText);
                    showToast("Copied filenames to clipboard");
                    
                    return Promise.resolve({ ok: true });
                }
            }

            return orig(...args);
        });
    },

    onUnload() {
        if (unpatchSendMessage) unpatchSendMessage();
        unpatchSendMessage = null;
    }
};

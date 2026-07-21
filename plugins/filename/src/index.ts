import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
import { clipboard } from "@vendetta/metro/common";

const MessageActions = findByProps("sendMessage", "receiveMessage") || findByProps("sendMessage", "editMessage");

let unpatchSendMessage: (() => void) | null = null;

export default {
    onLoad() {
        if (!MessageActions || !MessageActions.sendMessage) return;

        unpatchSendMessage = before("sendMessage", MessageActions, (args) => {
            const messageData = args[1];

            if (messageData && messageData.content === ".") {
                const attachments = messageData.attachments || messageData.fileUploads || [];

                if (attachments.length > 0) {
                    const slicedAttachments = attachments.slice(0, 10);
                    
                    const clipboardText = slicedAttachments.map((attachment: any) => {
                        const uploadedFilename = attachment.uploaded_filename || attachment.filename || "image.png";
                        return `.filename ${uploadedFilename}`;
                    }).join("\n");

                    clipboard.setString(clipboardText);
                    showToast("Copied filenames to clipboard");

                    messageData.content = "";
                    messageData.attachments = [];
                    if (messageData.fileUploads) {
                        messageData.fileUploads = [];
                    }

                    args[1] = messageData;
                }
            }
        });
    },

    onUnload() {
        if (unpatchSendMessage) unpatchSendMessage();
        unpatchSendMessage = null;
    }
};

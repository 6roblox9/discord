import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
import { clipboard } from "@vendetta/metro/common";

const MessageActions = findByProps("sendMessage", "editMessage");
const UploadStore = findByProps("getUploads");

let unpatchSendMessage: (() => void) | null = null;

export default {
    onLoad() {
        if (!MessageActions || !MessageActions.sendMessage) return;

        unpatchSendMessage = instead("sendMessage", MessageActions, (args, orig) => {
            const channelId = args[0];
            const messageData = args[1];

            if (messageData && messageData.content === ".") {
                let uploads: any[] = [];
                
                if (UploadStore && typeof UploadStore.getUploads === "function") {
                    uploads = UploadStore.getUploads(channelId, 0) || [];
                }

                if (!uploads || uploads.length === 0) {
                    uploads = messageData.attachments || messageData.fileUploads || [];
                }

                if (uploads.length > 0) {
                    const sliced = uploads.slice(0, 10);
                    
                    const isStillUploading = sliced.some(
                        (att) => !att.uploadedFilename && !att.uploaded_filename
                    );

                    if (isStillUploading) {
                        showToast("Please wait for images to finish uploading...");
                        return Promise.resolve({ ok: false });
                    }

                    const clipboardText = sliced.map((att) => {
                        const filename = att.uploadedFilename || att.uploaded_filename;
                        return `.filename ${filename}`;
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

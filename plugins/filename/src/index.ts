import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const { Clipboard } = ReactNative;

let unpatchPost: (() => void) | null = null;

export default {
    onLoad() {
        if (!RestAPI || !RestAPI.post) return;

        unpatchPost = instead("post", RestAPI, (args, orig) => {
            const req = args[0];

            if (req && req.url && typeof req.url === "string" && req.url.match(/^\/channels\/\d+\/messages/)) {
                const body = req.body;

                if (body && body.content === "." && body.attachments && body.attachments.length > 0) {
                    const slicedAttachments = body.attachments.slice(0, 10);
                    
                    const clipboardText = slicedAttachments.map((attachment: any) => {
                        const uploadedFilename = attachment.uploaded_filename || attachment.filename;
                        return `.filename ${uploadedFilename}`;
                    }).join("\n");

                    Clipboard.setString(clipboardText);
                    showToast("Copied filenames to clipboard");
                    
                    return Promise.reject(new Error("Prevented by plugin"));
                }
            }

            return orig(...args);
        });
    },

    onUnload() {
        if (unpatchPost) unpatchPost();
        unpatchPost = null;
    }
};

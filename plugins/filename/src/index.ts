import { findByProps } from "@vendetta/metro";
import { ReactNative } from "@vendetta/metro/common";
import { instead } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const MessageActions = findByProps("sendMessage", "editMessage");
const { Clipboard } = ReactNative;

let unpatchPost: (() => void) | null = null;
let unpatchSendMessage: (() => void) | null = null;
let lastUploadedFiles: string[] = [];

export default {
    onLoad() {
        if (RestAPI && RestAPI.post) {
            unpatchPost = instead("post", RestAPI, async (args, orig) => {
                try {
                    const req = args[0] || {};
                    const url = typeof args[0] === "string" ? args[0] : (req.url || "");
                    let body = args[1] || req.body || {};

                    if (typeof body === "string") {
                        try { body = JSON.parse(body); } catch (e) {}
                    }

                    if (url.match(/\/channels\/\d+\/messages/)) {
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

                    if (url.match(/\/channels\/\d+\/attachments/)) {
                        const response = await orig(...args);
                        if (response?.body?.attachments) {
                            const files = response.body.attachments
                                .map((a: any) => a.uploaded_filename)
                                .filter(Boolean);
                            if (files.length > 0) {
                                lastUploadedFiles = files;
                            }
                        }
                        return response;
                    }
                } catch (e) {}

                return orig(...args);
            });
        }

        if (MessageActions && MessageActions.sendMessage) {
            unpatchSendMessage = instead("sendMessage", MessageActions, (args, orig) => {
                const [channelId, messageData] = args;
                
                if (messageData && messageData.content === ".") {
                    const attachments = messageData.attachments || messageData.fileUploads || [];
                    
                    if (attachments.length > 0) {
                        let clipboardText = "";
                        const hasUploaded = attachments.some((a: any) => a.uploaded_filename);
                        
                        if (hasUploaded) {
                            const sliced = attachments.slice(0, 10);
                            clipboardText = sliced.map((a: any) => `.filename ${a.uploaded_filename || a.filename}`).join("\n");
                        } else if (lastUploadedFiles.length > 0) {
                            const sliced = lastUploadedFiles.slice(0, 10);
                            clipboardText = sliced.map((f: string) => `.filename ${f}`).join("\n");
                            lastUploadedFiles = [];
                        }

                        if (clipboardText) {
                            Clipboard.setString(clipboardText);
                            showToast("Copied filenames to clipboard");
                            return Promise.resolve({ ok: true });
                        }
                    }
                }
                
                return orig(...args);
            });
        }
    },

    onUnload() {
        if (unpatchPost) unpatchPost();
        if (unpatchSendMessage) unpatchSendMessage();
        unpatchPost = null;
        unpatchSendMessage = null;
        lastUploadedFiles = [];
    }
};

import { findByProps } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta";
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";

const DeleteIcon =
    getAssetIDByName("ic_message_delete") ??
    getAssetIDByName("TrashIcon") ??
    getAssetIDByName("trash") ??
    getAssetIDByName("ic_trash");

const EditIcon =
    getAssetIDByName("ic_message_edit") ??
    getAssetIDByName("PencilIcon") ??
    getAssetIDByName("pencil") ??
    getAssetIDByName("ic_edit");

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const ActionSheet = findByProps("openLazy", "hideActionSheet");
const { ActionSheetRow } = findByProps("ActionSheetRow");

async function silentDeleteMessage(channelId: string, messageId: string) {
    const RestAPI = findByProps("get", "post", "del", "patch");
    try {
        const replacementText: string = storage.replacementText ?? "** **";
        const deleteDelay: number = storage.deleteDelay ?? 200;
        const suppressNotifications: boolean = storage.suppressNotifications ?? true;

        const response = await RestAPI.post({
            url: `/channels/${channelId}/messages`,
            body: {
                content: replacementText,
                flags: suppressNotifications ? 4096 : 0,
                mobile_network_type: "unknown",
                nonce: messageId,
                tts: false,
            },
        });

        await sleep(deleteDelay);
        await RestAPI.del({ url: `/channels/${channelId}/messages/${response.body.id}` });
        await sleep(100);
        await RestAPI.del({ url: `/channels/${channelId}/messages/${messageId}` });
        logger.log("[SilentDelete] Success!");
        return true;
    } catch (err) {
        logger.log("[SilentDelete] Error: " + String(err));
        return false;
    }
}

async function silentEditMessage(channelId: string, messageId: string, originalContent: string) {
    const RestAPI = findByProps("get", "post", "del", "patch");
    const { Messages } = findByProps("sendMessage", "editMessage");
    
    try {
        const messages = Messages.forChannel(channelId);
        if (!messages) return false;
        
        messages._setEditing(messageId, originalContent);
        ActionSheet.hideActionSheet();
        return true;
    } catch (err) {
        logger.log("[SilentEdit] Error: " + String(err));
        return false;
    }
}

const originalSendMessage = findByProps("sendMessage").sendMessage;
const patchedSendMessage = async function(this: any, channelId: string, message: any, ...args: any[]) {
    const Messages = findByProps("sendMessage", "editMessage");
    const messages = Messages.forChannel(channelId);
    const editing = messages?._editing;
    const editingMessageId = editing?.messageId;
    
    if (editingMessageId && message.content !== editing.originalContent) {
        const RestAPI = findByProps("get", "post", "del", "patch");
        try {
            await RestAPI.post({
                url: `/channels/${channelId}/messages`,
                body: {
                    content: message.content,
                    flags: 4096,
                    mobile_network_type: "unknown",
                    nonce: editingMessageId,
                    tts: false,
                },
            });
            messages._clearEditing();
            logger.log("[SilentEdit] Silent edit sent!");
            return;
        } catch (err) {
            logger.log("[SilentEdit] Failed: " + String(err));
        }
    }
    
    return originalSendMessage.call(this, channelId, message, ...args);
};

let unpatchOpenLazy: (() => void) | null = null;
let unpatchSendMessage: (() => void) | null = null;

export default {
    onLoad() {
        storage.replacementText ??= "** **";
        storage.deleteDelay ??= 200;
        storage.suppressNotifications ??= true;

        const sendMessageModule = findByProps("sendMessage");
        unpatchSendMessage = after("sendMessage", sendMessageModule, (args: any[], ret: any) => {
            return patchedSendMessage.apply(this, args);
        });

        unpatchOpenLazy = before("openLazy", ActionSheet, ([comp, args, msg]) => {
            if (args !== "MessageLongPressActionSheet" || !msg?.message) return;

            const UserStore = findByProps("getCurrentUser");
            const currentUser = UserStore?.getCurrentUser();
            if (!currentUser || msg.message.author?.id !== currentUser.id) return;

            const channelId: string = msg.message.channel_id;
            const messageId: string = msg.message.id;
            const originalContent: string = msg.message.content || "";

            comp.then((instance: any) => {
                const unpatch = after("default", instance, (_: any, component: any) => {
                    React.useEffect(() => { unpatch(); }, []);

                    const groups: any[] = findInReactTree(
                        component,
                        (c: any) => Array.isArray(c) && c[0]?.type?.name === "ActionSheetRowGroup"
                    );

                    if (!groups?.length) {
                        logger.warn("[SilentDelete] Could not find ActionSheetRowGroups");
                        return;
                    }

                    const silentDeleteButton = React.createElement(ActionSheetRow, {
                        label: "Silent Delete",
                        destructive: true,
                        icon: React.createElement(ActionSheetRow.Icon, {
                            source: DeleteIcon,
                            color: "#ed4245",
                        }),
                        onPress: () => {
                            ActionSheet.hideActionSheet();
                            silentDeleteMessage(channelId, messageId);
                        },
                    });

                    const silentEditButton = React.createElement(ActionSheetRow, {
                        label: "Silent Edit",
                        icon: React.createElement(ActionSheetRow.Icon, {
                            source: EditIcon,
                        }),
                        onPress: () => {
                            silentEditMessage(channelId, messageId, originalContent);
                        },
                    });

                    let deleteIndex = -1;
                    let targetGroup = null;
                    
                    for (let gi = 0; gi < groups.length; gi++) {
                        const groupChildren: any[] = findInReactTree(
                            groups[gi],
                            (c: any) => Array.isArray(c) && c.some((child: any) =>
                                child?.type?.name === "ActionSheetRow"
                            )
                        );
                        if (!groupChildren) continue;

                        const idx = groupChildren.findIndex((c: any) =>
                            c?.props?.label?.toLowerCase?.()?.includes?.("delete") ||
                            c?.props?.message?.toLowerCase?.()?.includes?.("delete")
                        );

                        if (idx >= 0) {
                            deleteIndex = idx;
                            targetGroup = groupChildren;
                            break;
                        }
                    }

                    if (targetGroup && deleteIndex >= 0) {
                        targetGroup.splice(deleteIndex, 0, silentDeleteButton);
                        targetGroup.splice(deleteIndex + 2, 0, silentEditButton);
                    } else {
                        logger.warn("[SilentDelete] Delete row not found, inserting before last group");
                        const insertAt = Math.max(0, groups.length - 1);
                        groups.splice(insertAt, 0,
                            React.createElement(ActionSheetRow.Group, null, silentDeleteButton, silentEditButton)
                        );
                    }
                });
            });
        });

        logger.log("[SilentDelete] Loaded.");
    },

    onUnload() {
        unpatchOpenLazy?.();
        unpatchSendMessage?.();
        unpatchOpenLazy = null;
        unpatchSendMessage = null;
        logger.log("[SilentDelete] Unloaded.");
    },
};

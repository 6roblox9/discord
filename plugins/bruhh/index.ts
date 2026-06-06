import { findByProps } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta";
import { React } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";

const EditIcon =
    getAssetIDByName("ic_message_edit") ??
    getAssetIDByName("PencilIcon") ??
    getAssetIDByName("pencil") ??
    getAssetIDByName("ic_edit");

const ActionSheet = findByProps("openLazy", "hideActionSheet");
const { ActionSheetRow } = findByProps("ActionSheetRow");

async function silentEditMessage(channelId: string, messageId: string, originalContent: string) {
    const RestAPI = findByProps("get", "post", "del", "patch");
    const Dialog = findByProps("showTextInput");
    
    try {
        const newContent: string = await new Promise((resolve) => {
            Dialog.showTextInput({
                title: "Silent Edit",
                description: "Enter the new message content:",
                placeholder: originalContent,
                initialValue: originalContent,
                confirmText: "Edit",
                cancelText: "Cancel",
                onConfirm: (text: string) => resolve(text),
                onCancel: () => resolve(""),
            });
        });

        if (!newContent || newContent === originalContent) return false;

        await RestAPI.post({
            url: `/channels/${channelId}/messages`,
            body: {
                content: newContent,
                flags: 4096,
                mobile_network_type: "unknown",
                nonce: messageId,
                tts: false,
            },
        });

        logger.log("[SilentEdit] Success!");
        return true;
    } catch (err) {
        logger.log("[SilentEdit] Error: " + String(err));
        return false;
    }
}

let unpatchOpenLazy: (() => void) | null = null;

export default {
    onLoad() {
        storage.replacementText ??= "** **";
        storage.deleteDelay ??= 200;
        storage.suppressNotifications ??= true;

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
                        logger.warn("[SilentEdit] Could not find ActionSheetRowGroups");
                        return;
                    }

                    const silentEditButton = React.createElement(ActionSheetRow, {
                        label: "Silent Edit",
                        icon: React.createElement(ActionSheetRow.Icon, {
                            source: EditIcon,
                        }),
                        onPress: () => {
                            ActionSheet.hideActionSheet();
                            silentEditMessage(channelId, messageId, originalContent);
                        },
                    });

                    let replaced = false;
                    for (let gi = 0; gi < groups.length; gi++) {
                        const groupChildren: any[] = findInReactTree(
                            groups[gi],
                            (c: any) => Array.isArray(c) && c.some((child: any) =>
                                child?.type?.name === "ActionSheetRow"
                            )
                        );
                        if (!groupChildren) continue;

                        const editRowIndex = groupChildren.findIndex((c: any) =>
                            c?.props?.label?.toLowerCase?.() === "edit" ||
                            c?.props?.message?.toLowerCase?.() === "edit"
                        );

                        if (editRowIndex >= 0) {
                            groupChildren[editRowIndex] = silentEditButton;
                            replaced = true;
                            break;
                        }
                    }

                    if (!replaced) {
                        logger.warn("[SilentEdit] Edit row not found, inserting before last group");
                        const insertAt = Math.max(0, groups.length - 1);
                        groups.splice(insertAt, 0,
                            React.createElement(ActionSheetRow.Group, null, silentEditButton)
                        );
                    }
                });
            });
        });

        logger.log("[SilentEdit] Loaded.");
    },

    onUnload() {
        unpatchOpenLazy?.();
        unpatchOpenLazy = null;
        logger.log("[SilentEdit] Unloaded.");
    },
};

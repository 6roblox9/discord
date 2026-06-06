import { findByProps } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { React } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { showInputAlert } from "@vendetta/ui/alerts";

const APIUtils = findByProps("getAPIBaseURL", "del");
const ActionSheet = findByProps("openLazy", "hideActionSheet");
const { ActionSheetRow } = findByProps("ActionSheetRow");

const EditIcon =
    getAssetIDByName("ic_message_edit") ??
    getAssetIDByName("PencilIcon") ??
    getAssetIDByName("pencil") ??
    getAssetIDByName("ic_edit");

async function fakeEditMessage(channelId: string, messageId: string, originalContent: string) {
    showInputAlert({
        title: "Fake Edit",
        initialValue: originalContent,
        placeholder: "Enter new text...",
        confirmText: "Edit",
        cancelText: "Cancel",
        onConfirm: async (newContent: string) => {
            if (!newContent || newContent === originalContent) return;
            try {
                await APIUtils.post({
                    url: `/channels/${channelId}/messages`,
                    body: {
                        content: newContent,
                        flags: 4096,
                        mobile_network_type: "unknown",
                        nonce: messageId,
                        tts: false,
                    }
                });
                showToast("Fake Edit Success!");
            } catch (err: any) {
                showToast("Error: " + (err?.body ? JSON.stringify(err.body) : String(err)));
            }
        }
    });
}

let unpatchOpenLazy: (() => void) | null = null;

export default {
    onLoad() {
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
                    React.useEffect(() => () => { unpatch(); }, []);

                    const groups: any[] = findInReactTree(
                        component,
                        (c: any) => Array.isArray(c) && c[0]?.type?.name === "ActionSheetRowGroup"
                    );

                    if (!groups?.length) return;

                    const fakeEditButton = React.createElement(ActionSheetRow, {
                        label: "Fake Edit",
                        icon: React.createElement(ActionSheetRow.Icon, {
                            source: EditIcon,
                        }),
                        onPress: () => {
                            ActionSheet.hideActionSheet();
                            fakeEditMessage(channelId, messageId, originalContent);
                        },
                    });

                    let inserted = false;
                    for (let gi = 0; gi < groups.length; gi++) {
                        const groupChildren: any[] = findInReactTree(
                            groups[gi],
                            (c: any) => Array.isArray(c) && c.some((child: any) =>
                                child?.type?.name === "ActionSheetRow"
                            )
                        );
                        if (!groupChildren) continue;

                        const editRowIndex = groupChildren.findIndex((c: any) => {
                            const label = (c?.props?.label || c?.props?.message || "").toLowerCase();
                            return label === "edit" || label === "edit message" || label.includes("تعديل");
                        });

                        if (editRowIndex >= 0) {
                            groupChildren.splice(editRowIndex + 1, 0, fakeEditButton);
                            inserted = true;
                            break;
                        }
                    }

                    if (!inserted) {
                        const insertAt = Math.max(0, groups.length - 1);
                        groups.splice(insertAt, 0,
                            React.createElement(ActionSheetRow.Group, null, fakeEditButton)
                        );
                    }
                });
            });
        });
    },

    onUnload() {
        unpatchOpenLazy?.();
        unpatchOpenLazy = null;
    },
};

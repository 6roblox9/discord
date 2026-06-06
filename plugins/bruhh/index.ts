import { findByProps } from "@vendetta/metro";
import { before, after, instead } from "@vendetta/patcher";
import { React } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

const RestAPI = findByProps("get", "post", "del", "patch");
const ActionSheet = findByProps("openLazy", "hideActionSheet");
const { ActionSheetRow } = findByProps("ActionSheetRow");

const EditIcon =
    getAssetIDByName("ic_message_edit") ??
    getAssetIDByName("PencilIcon") ??
    getAssetIDByName("pencil") ??
    getAssetIDByName("ic_edit");

let unpatchOpenLazy: (() => void) | null = null;
let unpatchPatch: (() => void) | null = null;
let pendingFakeEdit: { channelId: string; messageId: string } | null = null;

export default {
    onLoad() {
        unpatchPatch = instead("patch", RestAPI, async (args, orig) => {
            const req = args[0];
            const urlMatch = req.url?.match(/\/channels\/(\d+)\/messages\/(\d+)/);
            
            if (urlMatch && pendingFakeEdit) {
                const messageId = urlMatch[2];
                
                if (pendingFakeEdit.messageId === messageId) {
                    const { channelId } = pendingFakeEdit;
                    pendingFakeEdit = null;
                    
                    try {
                        const response = await RestAPI.post({
                            url: `/channels/${channelId}/messages`,
                            body: {
                                content: req.body.content,
                                flags: 4096,
                                mobile_network_type: "unknown",
                                nonce: messageId,
                                tts: false,
                            }
                        });
                        showToast("Fake Edit Success!");
                        return response;
                    } catch (err: any) {
                        showToast("Error: " + (err?.body ? JSON.stringify(err.body) : String(err)));
                        return { status: 400, body: err };
                    }
                }
            }
            return orig(...args);
        });

        unpatchOpenLazy = before("openLazy", ActionSheet, ([comp, args, msg]) => {
            if (args !== "MessageLongPressActionSheet" || !msg?.message) return;

            const UserStore = findByProps("getCurrentUser");
            const currentUser = UserStore?.getCurrentUser();
            if (!currentUser || msg.message.author?.id !== currentUser.id) return;

            const channelId: string = msg.message.channel_id;
            const messageId: string = msg.message.id;

            comp.then((instance: any) => {
                const unpatch = after("default", instance, (_: any, component: any) => {
                    React.useEffect(() => () => { unpatch(); }, []);

                    const groups: any[] = findInReactTree(
                        component,
                        (c: any) => Array.isArray(c) && c[0]?.type?.name === "ActionSheetRowGroup"
                    );

                    if (!groups?.length) return;

                    let originalEditRow: any = null;
                    let targetGroupIndex = -1;

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
                            originalEditRow = groupChildren[editRowIndex];
                            targetGroupIndex = gi;
                            break;
                        }
                    }

                    if (!originalEditRow) return;

                    const fakeEditButton = React.createElement(ActionSheetRow, {
                        label: "Fake Edit",
                        icon: React.createElement(ActionSheetRow.Icon, {
                            source: EditIcon,
                        }),
                        onPress: () => {
                            pendingFakeEdit = { channelId, messageId };
                            ActionSheet.hideActionSheet();
                            if (typeof originalEditRow.props.onPress === "function") {
                                originalEditRow.props.onPress();
                            }
                        },
                    });

                    const targetChildren = findInReactTree(
                        groups[targetGroupIndex],
                        (c: any) => Array.isArray(c) && c.includes(originalEditRow)
                    );

                    if (targetChildren) {
                        const insertIndex = targetChildren.indexOf(originalEditRow) + 1;
                        targetChildren.splice(insertIndex, 0, fakeEditButton);
                    }
                });
            });
        });
    },

    onUnload() {
        unpatchOpenLazy?.();
        unpatchPatch?.();
        unpatchOpenLazy = null;
        unpatchPatch = null;
    },
};

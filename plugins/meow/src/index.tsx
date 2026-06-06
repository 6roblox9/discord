import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const RestAPI = findByProps("get", "post", "del", "patch");
const UserStore = findByProps("getCurrentUser");
const { ActionSheetRow } = findByProps("ActionSheetRow");

const RemoveIcon = 
    getAssetIDByName("ic_message_delete") ?? 
    getAssetIDByName("trash") ?? 
    getAssetIDByName("ic_trash_24px");

let unpatchActionSheet: (() => void) | null = null;

export default {
    onLoad() {
        unpatchActionSheet = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
            const message = msg?.message;
            if (key !== "MessageLongPressActionSheet" || !message) return;

            const currentUser = UserStore?.getCurrentUser();
            if (!currentUser || message.author?.id !== currentUser.id) return;

            const hasMedia = (message.attachments && message.attachments.length > 0) || (message.embeds && message.embeds.length > 0);
            if (!hasMedia) return;

            component.then((instance: any) => {
                const unpatch = after("default", instance, (_, comp) => {
                    React.useEffect(() => () => unpatch(), []);

                    const groups: any[] = findInReactTree(
                        comp,
                        (c: any) => Array.isArray(c) && c[0]?.type?.name === "ActionSheetRowGroup"
                    );

                    if (!groups?.length) return;

                    const removeMediaBtn = React.createElement(ActionSheetRow, {
                        label: "Remove Media",
                        destructive: true,
                        icon: React.createElement(ActionSheetRow.Icon, {
                            source: RemoveIcon,
                            color: "#ed4245",
                        }),
                        onPress: async () => {
                            LazyActionSheet.hideActionSheet();
                            
                            let content = message.content || "";
                            if (content.trim() === "") {
                                content = "** **";
                            }

                            const body: any = {
                                content: content,
                                nonce: message.id,
                                tts: false,
                                flags: message.flags ?? 0,
                                mobile_network_type: "wifi",
                            };

                            const ref = message.messageReference || message.message_reference;
                            if (ref) {
                                body.message_reference = {
                                    message_id: ref.message_id || ref.messageId,
                                    channel_id: ref.channel_id || ref.channelId,
                                    guild_id: ref.guild_id || ref.guildId,
                                };
                                
                                const repliedUser = message.referenced_message?.author?.id;
                                const hasPing = repliedUser ? message.mentions?.some((m: any) => m.id === repliedUser) : false;
                                
                                body.allowed_mentions = {
                                    replied_user: hasPing,
                                    parse: ["users", "roles", "everyone"]
                                };
                            }

                            try {
                                await RestAPI.post({
                                    url: `/channels/${message.channel_id}/messages`,
                                    body: body
                                });

                                await RestAPI.del({
                                    url: `/channels/${message.channel_id}/messages/${message.id}`
                                });

                                showToast("Media removed silently!");
                            } catch (err: any) {
                                showToast("Error: " + (err?.body?.message || err?.message || String(err)));
                            }
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

                        const deleteRowIndex = groupChildren.findIndex((c: any) =>
                            c?.props?.label?.toLowerCase?.()?.includes?.("delete") ||
                            c?.props?.message?.toLowerCase?.()?.includes?.("delete")
                        );

                        if (deleteRowIndex >= 0) {
                            groupChildren.splice(deleteRowIndex, 0, removeMediaBtn);
                            inserted = true;
                            break;
                        }
                    }

                    if (!inserted) {
                        const insertAt = Math.max(0, groups.length - 1);
                        groups.splice(insertAt, 0,
                            React.createElement(ActionSheetRow.Group, null, removeMediaBtn)
                        );
                    }
                });
            });
        });
    },

    onUnload() {
        unpatchActionSheet?.();
        unpatchActionSheet = null;
    }
};

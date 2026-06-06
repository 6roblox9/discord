import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after, before } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const RestAPI = findByProps("get", "post", "del", "patch");
const { FormIcon } = Forms;

let unpatchActionSheet: (() => void) | null = null;

export default {
    onLoad() {
        unpatchActionSheet = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
            const message = msg?.message;
            if (key !== "MessageLongPressActionSheet" || !message) return;

            const hasMedia = (message.attachments && message.attachments.length > 0) || (message.embeds && message.embeds.length > 0);
            if (!hasMedia) return;

            component.then((instance: any) => {
                const unpatch = after("default", instance, (_, comp) => {
                    React.useEffect(() => () => unpatch(), []);

                    const groups = findInReactTree(
                        comp,
                        (x) => Array.isArray(x) && x.some((y: any) => y?.type?.name === "ActionSheetRowGroup")
                    );

                    if (groups) {
                        for (const group of groups) {
                            if (group?.props?.children && Array.isArray(group.props.children)) {
                                const delIndex = group.props.children.findIndex((c: any) => c?.key === "delete");

                                if (delIndex !== -1) {
                                    const delBtn = group.props.children[delIndex];
                                    const ActionSheetRow = delBtn.type;

                                    const removeMediaBtn = (
                                        <ActionSheetRow
                                            label="Remove Media"
                                            icon={{
                                                $$typeof: delBtn.props.icon.$$typeof,
                                                type: delBtn.props.icon.type,
                                                key: null,
                                                ref: null,
                                                props: {
                                                    IconComponent: () => (
                                                        <FormIcon
                                                            style={{ opacity: 1 }}
                                                            source={getAssetIDByName("trash") || getAssetIDByName("ic_trash_24px")}
                                                        />
                                                    ),
                                                },
                                            }}
                                            onPress={async () => {
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
                                            }}
                                            key="remove-media"
                                        />
                                    );

                                    group.props.children.splice(delIndex, 0, removeMediaBtn);
                                    break;
                                }
                            }
                        }
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

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

                    const actionSheetContainer = findInReactTree(
                        comp,
                        (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
                    );

                    if (actionSheetContainer && actionSheetContainer[1]) {
                        const middleGroup = actionSheetContainer[1];
                        const ActionSheetRow = middleGroup.props.children[0]?.type;

                        if (!ActionSheetRow) return;

                        const removeMediaBtn = (
                            <ActionSheetRow
                                label="Remove Media"
                                icon={{
                                    $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
                                    type: middleGroup.props.children[0].props.icon.type,
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

                                    try {
                                        await RestAPI.patch({
                                            url: `/channels/${message.channel_id}/messages/${message.id}`,
                                            body: {
                                                content: content,
                                                attachments: [],
                                                embeds: [],
                                                flags: message.flags ?? 0
                                            }
                                        });
                                        showToast("Media removed successfully!");
                                    } catch (err: any) {
                                        showToast("Error: " + (err?.body?.message || err?.message || String(err)));
                                    }
                                }}
                                key="remove-media"
                            />
                        );

                        middleGroup.props.children.push(removeMediaBtn);
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

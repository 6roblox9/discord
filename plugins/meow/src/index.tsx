import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    if (!message || key !== "MessageLongPressActionSheet") return;

    const proxyUrl = 
        message.attachments?.[0]?.proxy_url || 
        message.attachments?.[0]?.proxyURL ||
        message.embeds?.[0]?.image?.proxyURL ||
        message.embeds?.[0]?.image?.proxy_url;

    if (!proxyUrl) return;

    component.then((instance: any) => {
        const unpatchAfter = after("default", instance, (_, component) => {
            React.useEffect(() => () => unpatchAfter(), []);

            const actionSheetContainer = findInReactTree(
                component,
                (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
            );

            if (actionSheetContainer && actionSheetContainer[1]) {
                const middleGroup = actionSheetContainer[1];
                const ActionSheetRow = middleGroup.props.children[0].type;
                const firstIcon = middleGroup.props.children[0].props.icon;

                const copyAction = () => {
                    LazyActionSheet.hideActionSheet();
                    clipboard.setString(proxyUrl);
                    showToast("Copied Proxy Link", getAssetIDByName("toast_copy_link"));
                };

                middleGroup.props.children.push(
                    <ActionSheetRow
                        label="Copy Proxy Link"
                        icon={{
                            $$typeof: firstIcon.$$typeof,
                            type: firstIcon.type,
                            key: null,
                            ref: null,
                            props: {
                                IconComponent: () => (
                                    <FormIcon
                                        style={{ opacity: 1 }}
                                        source={getAssetIDByName("ic_link")}
                                    />
                                ),
                            },
                        }}
                        onPress={copyAction}
                        key="copy-proxy-link"
                    />
                );
            }
        });
    });
});

export const onUnload = () => unpatch();

import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByName, findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const Navigation = findByProps("push", "pushLazy", "pop");
const { FormRow, FormIcon } = Forms;

let unpatch: () => void;

export default () => {
    unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
        const message = msg?.message;
        if (key !== "MessageLongPressActionSheet" || !message) return;
        
        // Check if message has any attachment with proxy_url
        const hasProxyUrl = message.attachments?.some((att: any) => att.proxy_url);
        if (!hasProxyUrl) return;

        component.then((instance) => {
            const afterPatch = after("default", instance, (_, component: any) => {
                React.useEffect(
                    () => () => {
                        afterPatch();
                    },
                    [],
                );

                const actionSheetContainer = findInReactTree(
                    component,
                    (x: any) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
                );
                const buttons = findInReactTree(
                    component,
                    (x: any) => x?.[0]?.type?.name === "ButtonRow",
                );

                // Get the proxy_url from attachments
                const proxyUrl = message.attachments.find((att: any) => att.proxy_url)?.proxy_url;

                if (buttons) {
                    buttons.push(
                        React.createElement(FormRow, {
                            label: "Copy Proxy Link",
                            leading: React.createElement(FormIcon, {
                                style: { opacity: 1 },
                                source: getAssetIDByName("ic_link")
                            }),
                            onPress: () => {
                                clipboard.setString(proxyUrl);
                                showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
                                LazyActionSheet.hideActionSheet();
                            }
                        })
                    );
                } else if (actionSheetContainer && actionSheetContainer[1]) {
                    const middleGroup = actionSheetContainer[1];
                    const ActionSheetRow = middleGroup.props.children[0].type;

                    const copyProxyButton = React.createElement(ActionSheetRow, {
                        label: "Copy Proxy Link",
                        icon: {
                            $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
                            type: middleGroup.props.children[0].props.icon.type,
                            key: null,
                            ref: null,
                            props: {
                                IconComponent: () => React.createElement(FormIcon, {
                                    style: { opacity: 1 },
                                    source: getAssetIDByName("ic_link")
                                })
                            }
                        },
                        onPress: () => {
                            clipboard.setString(proxyUrl);
                            showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
                            LazyActionSheet.hideActionSheet();
                        },
                        key: "copy-proxy-link"
                    });

                    middleGroup.props.children.push(copyProxyButton);
                }
            });
        });
    });
};

export const onUnload = () => {
    if (unpatch) unpatch();
};

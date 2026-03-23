import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByName, findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    const proxyUrl = message?.attachments?.[0]?.proxy_url;

    if (key !== "MessageLongPressActionSheet" || !proxyUrl) return;

    component.then((instance) => {
        const unpatchAfter = after("default", instance, (_, component) => {
            React.useEffect(() => () => unpatchAfter(), []);

            const actionSheetContainer = findInReactTree(
                component,
                (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
            );
            const buttons = findInReactTree(
                component,
                (x) => x?.[0]?.type?.name === "ButtonRow",
            );

            const copyAction = () => {
                LazyActionSheet.hideActionSheet();
                clipboard.setString(proxyUrl);
                showToast("Copied Proxy Link", getAssetIDByName("toast_copy_link"));
            };

            if (buttons) {
                buttons.push(
                    <FormRow
                        label="Copy Proxy Link"
                        leading={<FormIcon style={{ opacity: 1 }} source={getAssetIDByName("ic_link")} />}
                        onPress={copyAction}
                    />,
                );
            } else if (actionSheetContainer && actionSheetContainer[1]) {
                const middleGroup = actionSheetContainer[1];
                const ActionSheetRow = middleGroup.props.children[0].type;

                middleGroup.props.children.push(
                    <ActionSheetRow
                        label="Copy Proxy Link"
                        icon={{
                            $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
                            type: middleGroup.props.children[0].props.icon.type,
                            props: {
                                IconComponent: () => <FormIcon style={{ opacity: 1 }} source={getAssetIDByName("ic_link")} />,
                            },
                        }}
                        onPress={copyAction}
                        key="copy-proxy-link"
                    />,
                );
            }
        });
    });
});

export const onUnload = () => unpatch();

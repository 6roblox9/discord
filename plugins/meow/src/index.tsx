import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

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

            const actionSheetRows = findInReactTree(
                component,
                (x) => Array.isArray(x?.props?.children) && x?.type?.name === "ActionSheetRowGroup"
            );

            if (actionSheetRows) {
                const ActionSheetRow = actionSheetRows.props.children[0].type;

                const copyAction = () => {
                    LazyActionSheet.hideActionSheet();
                    clipboard.setString(proxyUrl);
                    showToast("Copied Proxy Link", getAssetIDByName("toast_copy_link"));
                };

                // إنشاء الأيقونة بشكل مبسط لتجنب الـ Crash
                const renderIcon = () => (
                    <FormIcon
                        style={{ opacity: 1 }}
                        source={getAssetIDByName("ic_link")}
                    />
                );

                actionSheetRows.props.children.push(
                    <ActionSheetRow
                        label="Copy Proxy Link"
                        onPress={copyAction}
                        key="copy-proxy-link"
                        // الطريقة الأكثر أماناً لحقن الأيقونة في Vendetta
                        icon={renderIcon()} 
                    />
                );
            }
        });
    });
});

export const onUnload = () => unpatch();

import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
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
            const afterPatch = after("default", instance, (_, component) => {
                // Find the action sheet container and buttons
                const actionSheetContainer = findInReactTree(
                    component,
                    (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
                );
                const buttons = findInReactTree(
                    component,
                    (x) => x?.[0]?.type?.name === "ButtonRow",
                );

                // Get the first proxy_url from attachments
                const proxyUrl = message.attachments.find((att: any) => att.proxy_url)?.proxy_url;

                const copyProxyButton = (
                    <FormRow
                        label="Copy Proxy Link"
                        leading={
                            <FormIcon
                                style={{ opacity: 1 }}
                                source={getAssetIDByName("ic_link")}
                            />
                        }
                        onPress={() => {
                            clipboard.setString(proxyUrl);
                            showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
                            LazyActionSheet.hideActionSheet();
                        }}
                    />
                );

                if (buttons) {
                    buttons.push(copyProxyButton);
                } else if (actionSheetContainer && actionSheetContainer[1]) {
                    const middleGroup = actionSheetContainer[1];
                    const ActionSheetRow = middleGroup.props.children[0].type;
                    
                    const copyProxyActionRow = (
                        <ActionSheetRow
                            label="Copy Proxy Link"
                            icon={{
                                $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
                                type: middleGroup.props.children[0].props.icon.type,
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
                            onPress={() => {
                                clipboard.setString(proxyUrl);
                                showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
                                LazyActionSheet.hideActionSheet();
                            }}
                            key="copy-proxy-link"
                        />
                    );
                    
                    middleGroup.props.children.push(copyProxyActionRow);
                }
            });
            
            // Store the afterPatch to clean up later
            // This is a simplified version - you might want to track patches properly
            setTimeout(() => afterPatch(), 0);
        });
    });
};

export const onUnload = () => {
    if (unpatch) unpatch();
};

// Helper function for after patches
function after(target: string, obj: any, callback: any) {
    const original = obj[target];
    obj[target] = function(...args: any[]) {
        const result = original.apply(this, args);
        callback(result, ...args);
        return result;
    };
    return () => {
        obj[target] = original;
    };
}

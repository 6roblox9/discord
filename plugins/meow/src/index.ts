import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

let unpatch: () => void;

export default () => {
    unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
        const message = msg?.message;
        if (key !== "MessageLongPressActionSheet" || !message) return;
        
        const hasProxyUrl = message.attachments?.some((att: any) => att.proxy_url);
        if (!hasProxyUrl) return;

        component.then((instance) => {
            const orig = instance.default;
            instance.default = (props: any) => {
                const result = orig(props);
                
                // Find all rows and add our button
                const findAndAddButton = (obj: any) => {
                    if (!obj) return;
                    
                    // Check if this is a row group
                    if (obj.type?.name === "ActionSheetRowGroup" && Array.isArray(obj.props?.children)) {
                        const proxyUrl = message.attachments.find((att: any) => att.proxy_url)?.proxy_url;
                        
                        const button = React.createElement(FormRow, {
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
                        });
                        
                        obj.props.children.push(button);
                        console.log("[CopyProxyLink] Button added successfully!");
                    }
                    
                    // Recursively search children
                    if (obj.props?.children) {
                        if (Array.isArray(obj.props.children)) {
                            obj.props.children.forEach(findAndAddButton);
                        } else if (typeof obj.props.children === 'object') {
                            findAndAddButton(obj.props.children);
                        }
                    }
                };
                
                findAndAddButton(result);
                return result;
            };
        });
    });
};

export const onUnload = () => {
    if (unpatch) unpatch();
};

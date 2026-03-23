import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
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
        
        // Check if message has any attachment with proxy_url
        const hasProxyUrl = message.attachments?.some((att: any) => att.proxy_url);
        if (!hasProxyUrl) return;

        component.then((instance) => {
            const afterPatch = after("default", instance, (_, component: any) => {
                // Try to find buttons array directly
                let buttonsArray = null;
                
                // Search through the component tree
                const searchForButtons = (obj: any): any => {
                    if (!obj) return null;
                    
                    // Check if this is a ButtonRow
                    if (obj.type?.name === "ButtonRow" && Array.isArray(obj.props?.children)) {
                        return obj.props.children;
                    }
                    
                    // Check props.children
                    if (obj.props?.children) {
                        if (Array.isArray(obj.props.children)) {
                            for (const child of obj.props.children) {
                                const found = searchForButtons(child);
                                if (found) return found;
                            }
                        } else if (typeof obj.props.children === 'object') {
                            const found = searchForButtons(obj.props.children);
                            if (found) return found;
                        }
                    }
                    
                    return null;
                };
                
                buttonsArray = searchForButtons(component);
                
                // Get the proxy_url
                const proxyUrl = message.attachments.find((att: any) => att.proxy_url)?.proxy_url;
                
                if (buttonsArray) {
                    // Add our button to the existing buttons array
                    const copyProxyButton = React.createElement(FormRow, {
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
                    
                    buttonsArray.push(copyProxyButton);
                    console.log("[CopyProxyLink] Button added successfully!");
                } else {
                    console.log("[CopyProxyLink] Could not find buttons array");
                    
                    // Try alternative: find ActionSheetRowGroup
                    const findActionSheetGroup = (obj: any): any => {
                        if (!obj) return null;
                        if (obj.type?.name === "ActionSheetRowGroup" && obj.props?.children) {
                            return obj.props.children;
                        }
                        if (obj.props?.children) {
                            if (Array.isArray(obj.props.children)) {
                                for (const child of obj.props.children) {
                                    const found = findActionSheetGroup(child);
                                    if (found) return found;
                                }
                            } else if (typeof obj.props.children === 'object') {
                                const found = findActionSheetGroup(obj.props.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    
                    const actionSheetGroup = findActionSheetGroup(component);
                    if (actionSheetGroup) {
                        const copyProxyButton = React.createElement(FormRow, {
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
                        
                        actionSheetGroup.push(copyProxyButton);
                        console.log("[CopyProxyLink] Added to ActionSheetRowGroup!");
                    } else {
                        console.log("[CopyProxyLink] Could not find any place to add button");
                    }
                }
            });
        });
    });
};

export const onUnload = () => {
    if (unpatch) unpatch();
};

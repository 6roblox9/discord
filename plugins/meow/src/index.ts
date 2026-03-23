import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const Commands = findByProps("registerCommand", "unregisterCommand");
const { FormRow, FormIcon } = Forms;

let unpatch: () => void;
let logs: string[] = [];

function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    logs.unshift(`[${timestamp}] ${message}`);
    // Keep only last 50 logs
    if (logs.length > 50) logs.pop();
    console.log(`[CopyProxyLink] ${message}`);
}

export default () => {
    // Register slash command
    const command = {
        name: "plog",
        displayName: "plog",
        description: "Show plugin logs",
        displayDescription: "Show plugin logs",
        options: [],
        execute: (args: any, ctx: any) => {
            if (logs.length === 0) {
                return {
                    content: "No logs yet. Try long pressing a message with an attachment!"
                };
            }
            
            return {
                content: `**CopyProxyLink Plugin Logs** (last ${logs.length}):\n\`\`\`\n${logs.join("\n")}\n\`\`\``
            };
        }
    };
    
    try {
        Commands.registerCommand(command);
        addLog("Plugin loaded, command /plog registered");
    } catch (e) {
        console.error("[CopyProxyLink] Failed to register command:", e);
    }
    
    // Main plugin functionality
    unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
        const message = msg?.message;
        addLog(`Long press detected, key: ${key}`);
        
        if (key !== "MessageLongPressActionSheet" || !message) {
            addLog(`Skipping: key=${key}, hasMessage=${!!message}`);
            return;
        }
        
        addLog(`Processing message ${message.id}`);
        
        // Check if message has any attachment with proxy_url
        const hasProxyUrl = message.attachments?.some((att: any) => att.proxy_url);
        addLog(`Has proxy_url: ${hasProxyUrl}, attachments count: ${message.attachments?.length || 0}`);
        
        if (!hasProxyUrl) {
            addLog("No proxy_url found, skipping button addition");
            return;
        }

        const proxyUrl = message.attachments.find((att: any) => att.proxy_url)?.proxy_url;
        addLog(`Found proxy_url: ${proxyUrl?.substring(0, 50)}...`);

        component.then((instance) => {
            addLog("Component loaded, attempting to add button");
            
            const orig = instance.default;
            instance.default = (props: any) => {
                const result = orig(props);
                
                // Try to find buttons array
                let buttonsFound = false;
                const searchButtons = (obj: any): any => {
                    if (!obj) return null;
                    if (obj.props?.children && Array.isArray(obj.props.children) && obj.props.children[0]?.type?.name === "ButtonRow") {
                        return obj.props.children;
                    }
                    if (obj.props?.children) {
                        if (Array.isArray(obj.props.children)) {
                            for (const child of obj.props.children) {
                                const found = searchButtons(child);
                                if (found) return found;
                            }
                        } else if (typeof obj.props.children === 'object') {
                            const found = searchButtons(obj.props.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                
                const buttonsArray = searchButtons(result);
                
                if (buttonsArray) {
                    const copyProxyButton = React.createElement(FormRow, {
                        label: "Copy Proxy Link",
                        leading: React.createElement(FormIcon, {
                            style: { opacity: 1 },
                            source: getAssetIDByName("ic_link")
                        }),
                        onPress: () => {
                            addLog("Button pressed, copying proxy link");
                            clipboard.setString(proxyUrl);
                            showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
                            LazyActionSheet.hideActionSheet();
                        }
                    });
                    
                    buttonsArray.push(copyProxyButton);
                    addLog("Button added successfully!");
                    buttonsFound = true;
                }
                
                if (!buttonsFound) {
                    addLog("Could not find buttons array to add button");
                }
                
                return result;
            };
        }).catch((err: any) => {
            addLog(`Error loading component: ${err}`);
        });
    });
};

export const onUnload = () => {
    addLog("Plugin unloading");
    try {
        Commands.unregisterCommand("plog");
        addLog("Command /plog unregistered");
    } catch (e) {
        console.error("[CopyProxyLink] Failed to unregister command:", e);
    }
    if (unpatch) unpatch();
};

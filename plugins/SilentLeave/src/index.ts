import { registerCommand } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";
import { React, url } from "@vendetta/metro/common";
import { Forms, General } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";

const ChannelStore = findByProps("getChannel");
const getTokenModule = findByProps("getToken");

let unregister;

const Settings = () => {
    storage.commandName ??= "leave";
    const [command, setCommand] = React.useState(storage.commandName);

    return (
        <General.ScrollView>
            <Forms.FormSection title="Settings">
                <Forms.FormInput
                    label="Command Name"
                    placeholder="leave"
                    value={command}
                    onChange={(val) => {
                        setCommand(val);
                        storage.commandName = val;
                    }}
                />
                <Forms.FormDivider />
                <Forms.FormRow
                    label="Source Code"
                    subLabel="View on GitHub"
                    leading={<Forms.FormIcon source={getAssetIDByName("img_account_sync_github_white")} />}
                    onPress={() => url.openURL("https://google.com")}
                />
            </Forms.FormSection>
        </General.ScrollView>
    );
};

const registerLeaveCommand = () => {
    if (unregister) unregister();
    
    unregister = registerCommand({
        name: storage.commandName || "leave",
        description: "Leave the current Group DM silently",
        options: [],
        execute: (_, ctx) => {
            const channelId = ctx?.channel?.id;
            const channel = ChannelStore?.getChannel(channelId);

            if (!channel || channel.type !== 3) {
                showToast("This command works only in Group DMs.");
                return;
            }

            const token = getTokenModule?.getToken();
            if (!token) {
                showToast("Failed to get token.");
                return;
            }

            fetch(`https://discord.com/api/v9/channels/${channelId}?silent=true`, {
                method: "DELETE",
                headers: {
                    "Authorization": token,
                    "User-Agent": "Discord-Android/305012;RNA",
                    "Accept-Encoding": "gzip"
                }
            })
            .then(res => {
                if (res.ok) showToast("Left Group DM successfully.");
                else showToast(`Failed: ${res.status}`);
            })
            .catch(e => showToast(`Error: ${e.message}`));
        },
    });
};

export default {
    onLoad: () => {
        storage.commandName ??= "leave";
        registerLeaveCommand();
    },
    onUnload: () => {
        if (unregister) unregister();
    },
    settings: Settings
};


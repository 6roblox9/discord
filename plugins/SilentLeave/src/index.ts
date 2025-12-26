import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";
import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";

const ChannelStore = findByProps("getChannel");
const getToken = findByProps("getToken").getToken;

let leaveCommandName = storage.get("leaveCommandName") || "leave";
let commandUnregister: (() => void) | null = null;

const registerLeaveCommand = () => {
  if (commandUnregister) commandUnregister();
  commandUnregister = registerCommand({
    name: leaveCommandName,
    description: "Leave the current Group DM silently",
    options: [],
    execute: (_, ctx) => {
      const channelId = ctx?.channel?.id;
      const channel = ChannelStore.getChannel(channelId);

      if (!channel || channel.type !== 3) {
        showToast("This command works only in Group DMs.");
        return;
      }

      const token = getToken();
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
        else showToast(`Failed to leave Group DM: ${res.status}`);
      })
      .catch(e => showToast(`Error: ${e.message}`));
    },
  });
};

const SettingsComponent = () => {
  const [cmdName, setCmdName] = React.useState(leaveCommandName);

  const saveCommandName = () => {
    if (cmdName.trim()) {
      leaveCommandName = cmdName.trim();
      storage.set("leaveCommandName", leaveCommandName);
      registerLeaveCommand();
      showToast("Command updated successfully", getAssetIDByName("ic_check"));
    }
  };

  const openSourceCode = () => {
    window.open("https://www.google.com", "_blank");
  };

  return React.createElement(Forms.FormSection, { title: "Leave Command Settings" },
    React.createElement(Forms.FormText, null, "Customize your leave command:"),
    React.createElement(Forms.FormInput, {
      placeholder: "Enter command name",
      value: cmdName,
      onChange: setCmdName,
      onSubmitEditing: saveCommandName
    }),
    React.createElement(Forms.FormRow, { label: "Save Command Name", onPress: saveCommandName }),
    React.createElement(Forms.FormRow, {
      label: "Source Code",
      trailing: React.createElement("img", { src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png", style: { width: 20, height: 20 } }),
      onPress: openSourceCode
    })
  );
};

export const loadCommands = () => registerLeaveCommand();
export const unloadCommands = () => {
  if (commandUnregister) commandUnregister();
  unregisterAllCommands();
};

export default {
  onLoad() { loadCommands(); },
  onunload() { unloadCommands(); },
  settings: SettingsComponent
};


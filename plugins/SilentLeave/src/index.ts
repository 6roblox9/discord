import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const ChannelStore = findByProps("getChannel");
const getToken = findByProps("getToken").getToken;
const discordVersion = findByProps("version")?.version || "305012";

export const loadCommands = () => {
  registerCommand({
    name: "leave",
    description: "Leave the current Group DM silently",
    options: [],
    execute: (_, ctx) => {
      const channelId = ctx?.channel?.id;
      const channel = ChannelStore.getChannel(channelId);
      if (!channel || !Array.isArray(channel.recipients)) {
        showToast("This command works only in Group DMs.");
        return;
      }
      const token = getToken();
      if (!token) {
        showToast("Failed to get token.");
        return;
      }
      const userAgent = `Discord-Android/${discordVersion};RNA`;
      fetch(`https://discord.com/api/v9/channels/${channelId}?silent=true`, {
        method: "DELETE",
        headers: {
          "Authorization": token,
          "User-Agent": userAgent,
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

export const unloadCommands = () => unregisterAllCommands();

export default {
  onLoad() { loadCommands(); },
  onunload() { unloadCommands(); }
};


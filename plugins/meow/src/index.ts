import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const APIUtils = findByProps("getAPIBaseURL", "get", "post", "del");

async function deleteMessages(channelId, messageType, targetUser = null) {
  const filters = {
    all: (msg) => msg.author.id === targetUser?.id || !targetUser,
    files: (msg) => msg.author.id === targetUser?.id || !targetUser && msg.attachments.length > 0,
    links: (msg) => msg.author.id === targetUser?.id || !targetUser && /https?:\/\/\S+/.test(msg.content),
    text: (msg) => msg.author.id === targetUser?.id || !targetUser && !msg.attachments.length && !/https?:\/\/\S+/.test(msg.content)
  };

  try {
    const messages = await APIUtils.get(`/channels/${channelId}/messages`);
    const messagesToDelete = messages.filter(filters[messageType]);

    for (const message of messagesToDelete) {
      await APIUtils.del({
        url: `/channels/${channelId}/messages/${message.id}`
      });
    }

    showToast(`Deleted ${messagesToDelete.length} ${messageType} message(s)`);
  } catch {
    showToast("Request failed");
  }
}

async function handleCommand(args, context) {
  const { channelId, channelType, guildId, member } = context;

  const messageType = args?.type;
  const who = args?.who;

  let targetUser = null;

  if (who && who !== 'me' && who !== 'everyone') {
    targetUser = who;  // Assuming it's a user ID
  }

  if (channelType === 'DM' || channelType === 'GROUP_DM') {
    if (['all', 'files', 'links', 'text'].includes(messageType)) {
      await deleteMessages(channelId, messageType, targetUser);
    } else {
      showToast("Invalid type. Use: all, files, links, or text.");
    }
    return;
  }

  if (guildId) {
    const memberPermissions = await APIUtils.get(`/guilds/${guildId}/members/${member.id}/permissions`);
    if (memberPermissions.includes("MANAGE_MESSAGES")) {
      if (who === 'me' || who === 'everyone') {
        await deleteMessages(channelId, messageType, who === 'me' ? member : null);
      } else if (targetUser) {
        await deleteMessages(channelId, messageType, { id: targetUser });
      } else {
        showToast("Invalid 'who' value. Use: me, everyone, or a user ID.");
      }
    } else {
      showToast("You do not have permission to manage messages in this channel.");
    }
  }
}

export const loadCommands = () => {
  registerCommand({
    name: "del",
    description: "Delete messages in current channel based on type",
    options: [
      {
        name: "type",
        description: "all | files | links | text",
        type: 4,
        required: true
      },
      {
        name: "who",
        description: "me | everyone | user ID",
        type: 3,
        required: false
      }
    ],
    execute: (args, context) => handleCommand(args, context)
  });
};

export const unloadCommands = () => unregisterAllCommands();

export default {
  onLoad() {
    loadCommands();
  },
  onUnload() {
    unloadCommands();
  },
  settings: Settings
};

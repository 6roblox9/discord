import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const APIUtils = findByProps("getAPIBaseURL", "get", "post", "del");
const { getCurrentUser } = findByProps("getCurrentUser");

async function deleteMessages(channelId, messageType, targetUser = null) {
  try {
    const messages = await APIUtils.get({
      url: `/channels/${channelId}/messages`,
      query: { limit: 100 }
    });

    const messagesToDelete = messages.filter(msg => {
      if (targetUser && targetUser.id !== 'everyone' && msg.author.id !== targetUser.id) {
        return false;
      }
      
      switch(messageType) {
        case 'all':
          return true;
        case 'files':
          return msg.attachments.length > 0;
        case 'links':
          return /https?:\/\/\S+/.test(msg.content);
        case 'text':
          return !msg.attachments.length && !/https?:\/\/\S+/.test(msg.content);
        default:
          return false;
      }
    });

    for (const message of messagesToDelete) {
      try {
        await APIUtils.del({
          url: `/channels/${channelId}/messages/${message.id}`
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log(`Failed to delete message ${message.id}:`, e);
      }
    }

    showToast(`✅ Deleted ${messagesToDelete.length} messages`);
  } catch (e) {
    console.log("Error:", e);
    showToast("❌ Request failed");
  }
}

async function handleCommand(args, ctx) {
  try {
    if (!args || !args.type) {
      showToast("❌ Please specify message type");
      return;
    }

    const channel = ctx?.channel;
    if (!channel) {
      showToast("❌ No channel found");
      return;
    }

    const messageType = args.type;
    const who = args.who || 'me';

    const currentUser = getCurrentUser();
    let targetUser = null;
    
    if (who === 'me') {
      targetUser = currentUser;
    } else if (who === 'everyone') {
      targetUser = { id: 'everyone' };
    } else {
      targetUser = { id: who };
    }

    await deleteMessages(channel.id, messageType, targetUser);
    
  } catch (e) {
    console.log("Command error:", e);
    showToast("❌ Command execution failed");
  }
}

export default {
  onLoad: () => {
    registerCommand({
      name: "del",
      description: "Delete messages in current channel",
      options: [
        {
          name: "type",
          description: "Message type (all, files, links, text)",
          type: 3,
          required: true,
          choices: [
            { name: "All", value: "all" },
            { name: "Files", value: "files" },
            { name: "Links", value: "links" },
            { name: "Text only", value: "text" }
          ]
        },
        {
          name: "who",
          description: "Who? (me, everyone, or user ID)",
          type: 3,
          required: false,
          choices: [
            { name: "Me", value: "me" },
            { name: "Everyone", value: "everyone" }
          ]
        }
      ],
      execute: handleCommand
    });
  },
  onUnload: () => {
    unregisterAllCommands();
  }
};

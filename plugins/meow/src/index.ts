import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const APIUtils = findByProps("getAPIBaseURL", "get", "post", "del");
const { getCurrentUser } = findByProps("getCurrentUser");
const http = findByProps("get", "post", "delete");

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

    let deletedCount = 0;
    for (const message of messagesToDelete) {
      try {
        await http.delete({
          url: `/channels/${channelId}/messages/${message.id}`
        });
        deletedCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log(`Failed to delete message ${message.id}:`, e);
      }
    }

    showToast(`✅ Deleted ${deletedCount} messages`);
  } catch (e) {
    console.log("Error:", e);
    showToast("❌ Request failed");
  }
}

async function handleCommand(args, ctx) {
  try {
    let messageType = args?.type;
    let who = args?.who || 'me';

    if (!messageType) {
      if (args?.[0]?.name === 'type') {
        messageType = args[0].value;
      } else if (args?.[0]?.value) {
        messageType = args[0].value;
      } else if (typeof args === 'object' && args !== null) {
        const firstKey = Object.keys(args)[0];
        if (firstKey && args[firstKey]) {
          messageType = args[firstKey];
        }
      }
    }

    if (!messageType) {
      showToast("❌ Please specify message type (all, files, links, text)");
      return;
    }

    const validTypes = ['all', 'files', 'links', 'text'];
    if (!validTypes.includes(messageType)) {
      showToast("❌ Invalid type. Use: all, files, links, text");
      return;
    }

    const channel = ctx?.channel;
    if (!channel) {
      showToast("❌ No channel found");
      return;
    }

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
          description: "all, files, links, text",
          type: 3,
          required: true
        },
        {
          name: "who",
          description: "me, everyone, or user ID",
          type: 3,
          required: false
        }
      ],
      execute: handleCommand
    });
  },
  onUnload: () => {
    unregisterAllCommands();
  }
};

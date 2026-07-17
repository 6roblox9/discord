import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";
import Settings from "./settings";

const FluxDispatcher = findByProps("dispatch", "subscribe");
const ChannelStore = findByProps("getChannel");
const GuildStore = findByProps("getGuild");
const UserStore = findByProps("getUser", "getCurrentUser");
const RelationshipStore = findByProps("getFriendIDs");
const MessageActions = findByProps("sendMessage", "editMessage");

if (storage.trackServers === undefined) storage.trackServers = true;
if (storage.trackGroups === undefined) storage.trackGroups = true;
if (storage.trackDMs === undefined) storage.trackDMs = true;
if (storage.exactMatch === undefined) storage.exactMatch = false;
if (storage.caseSensitive === undefined) storage.caseSensitive = false;
if (storage.inSentence === undefined) storage.inSentence = true;
if (storage.sendNotificationToChannel === undefined) storage.sendNotificationToChannel = false;
if (storage.keyword === undefined) storage.keyword = "";
if (storage.targetChannelId === undefined) storage.targetChannelId = "";
if (storage.trackMode === undefined) storage.trackMode = "everyone";
if (storage.customIds === undefined) storage.customIds = "";

let unsubMessage: (() => void) | null = null;

export default {
  onLoad() {
    const onMessage = (p: any) => {
      const m = p?.message;
      if (!m || !m.content || !storage.keyword) return;

      const currentUser = UserStore.getCurrentUser();
      if (m.author?.id === currentUser?.id) return;

      const authorId = m.author?.id;
      
      if (storage.trackMode === "friends") {
        const friends = RelationshipStore.getFriendIDs();
        if (!friends.includes(authorId)) return;
      } else if (storage.trackMode === "custom") {
        const customList = storage.customIds.split(",").map((id: string) => id.trim());
        if (!customList.includes(authorId)) return;
      }

      const c = ChannelStore.getChannel(m.channel_id);
      if (!c) return;

      if (c.guild_id && !storage.trackServers) return;
      if (c.type === 3 && !storage.trackGroups) return;
      if ((c.type === 1 || (c.type === 0 && !c.guild_id)) && !storage.trackDMs) return;

      let content = m.content;
      let kw = storage.keyword;

      if (!storage.caseSensitive) {
        content = content.toLowerCase();
        kw = kw.toLowerCase();
      }

      let isMatch = false;
      if (storage.exactMatch) {
        isMatch = content === kw;
      } else if (storage.inSentence) {
        isMatch = content.includes(kw);
      } else {
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, storage.caseSensitive ? '' : 'i');
        isMatch = regex.test(m.content);
      }

      if (!isMatch) return;

      const author = m.author;
      const authorName = author.username;
      let locationStr = "";
      let messageLink = "";
      let extraInfo = "";
      let locationType = "";

      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        locationType = "Server";
        locationStr = `Server: ${g?.name} #${c.name}`;
        messageLink = `https://discord.com/channels/${c.guild_id}/${c.id}/${m.id}`;
        extraInfo = `\n**Server:** ${g?.name} (ID: ${c.guild_id})\n**Channel:** <#${c.id}> ${c.name} (ID: ${c.id})`;
      } else if (c.type === 3) {
        locationType = "Group";
        locationStr = `Group: ${c.name || 'Unnamed'}`;
        messageLink = `https://discord.com/channels/@me/${c.id}/${m.id}`;
        extraInfo = `\n**Group:** <#${c.id}> ${c.name || 'Unnamed Group'} (ID: ${c.id})`;
      } else {
        locationType = "DM";
        locationStr = "DM";
        messageLink = `https://discord.com/channels/@me/${c.id}/${m.id}`;
      }

      if (storage.sendNotificationToChannel && storage.targetChannelId) {
        showToast(`${authorName} sent a tracked message`);
        
        const messageContent = `**Keyword Detected!**\n\n**User:** <@${author.id}> (Username: ${authorName}, ID: ${author.id})\n**Message:** ${m.content}\n**Location:** ${locationType}${extraInfo}\n**Message Link:** ${messageLink}`;
        
        MessageActions.sendMessage(storage.targetChannelId.trim(), { content: messageContent, validNonShortcutEmojis: [] });
      } else {
        showToast(`${authorName} said "${storage.keyword}" in ${locationStr}`);
      }
    };

    FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    unsubMessage = () => FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
  },

  onUnload() {
    unsubMessage?.();
  },

  settings: Settings,
};

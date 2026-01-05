import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";
import Settings from "./settings";

const FluxDispatcher = findByProps("dispatch", "subscribe");
const PresenceStore = findByProps("getStatus");
const RelationshipStore = findByProps("getFriendIDs");
const ChannelStore = findByProps("getChannel");
const GuildStore = findByProps("getGuild");
const UserStore = findByProps("getUser");

if (storage.trackFriends === undefined) storage.trackFriends = true;
if (!storage.userIds) storage.userIds = [];
if (storage.trackMessages === undefined) storage.trackMessages = true;
if (storage.trackTyping === undefined) storage.trackTyping = true;
if (storage.trackVoice === undefined) storage.trackVoice = true;
if (storage.trackProfile === undefined) storage.trackProfile = true;
if (storage.trackDM === undefined) storage.trackDM = true;
if (storage.trackGroupDM === undefined) storage.trackGroupDM = true;
if (storage.trackServers === undefined) storage.trackServers = true;

const lastStatuses: Record<string, string | undefined> = {};
const lastProfile: Record<string, any> = {};

const getTrackedIds = () => {
  const ids = new Set<string>();
  if (storage.trackFriends) {
    for (const id of RelationshipStore.getFriendIDs()) ids.add(id);
  }
  for (const id of storage.userIds) ids.add(id);
  return [...ids];
};

const getName = (id: string) => UserStore.getUser(id)?.username ?? id;

const shouldNotifyChannel = (channel: any) => {
  if (channel.guild_id) return storage.trackServers;
  if (channel.type === 3) return storage.trackGroupDM;
  return storage.trackDM;
};

let unpatchPresence: (() => void) | null = null;
let unpatchProfile: (() => void) | null = null;
let unsubMessage: (() => void) | null = null;
let unsubTyping: (() => void) | null = null;
let unsubVoice: (() => void) | null = null;

export default {
  onLoad() {
    for (const id of getTrackedIds()) {
      lastStatuses[id] = PresenceStore.getStatus(id);
      const user = UserStore.getUser(id);
      if (user) lastProfile[id] = { username: user.username, avatar: user.avatar };
    }

    if (storage.trackProfile) {
      unpatchProfile = after("dispatch", FluxDispatcher, ([p]) => {
        if (p?.type !== "USER_UPDATE") return;
        const id = p.user?.id;
        if (!getTrackedIds().includes(id)) return;
        const old = lastProfile[id];
        const current = { username: p.user.username, avatar: p.user.avatar };
        if (old && (old.username !== current.username || old.avatar !== current.avatar)) {
          showToast(`${getName(id)} updated their profile`);
        }
        lastProfile[id] = current;
      });
    }

    if (storage.trackProfile) {
      unpatchPresence = after("dispatch", FluxDispatcher, ([p]) => {
        if (p?.type !== "PRESENCE_UPDATE") return;
        const id = p.user?.id;
        if (!getTrackedIds().includes(id)) return;
        if (lastStatuses[id] !== p.status) {
          lastStatuses[id] = p.status;
          showToast(`${getName(id)} is now ${p.status}`);
        }
      });
    }

    const onMessage = (p: any) => {
      if (!storage.trackMessages) return;
      const m = p?.message;
      const id = m?.author?.id;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(m.channel_id);
      if (!c || !shouldNotifyChannel(c)) return;

      let location = "";
      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        location = `${g?.name} #${c.name}`;
      } else if (c.type === 3) {
        location = "group";
      } else {
        location = "DM";
      }
      showToast(`${getName(id)} messaged in ${location}`);
    };

    const onTyping = (p: any) => {
      if (!storage.trackTyping) return;
      const id = p?.userId;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(p.channelId);
      if (!c || !shouldNotifyChannel(c)) return;

      let location = "";
      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        location = `${g?.name} #${c.name}`;
      } else if (c.type === 3) {
        location = "group";
      } else {
        location = "DM";
      }
      showToast(`${getName(id)} typing in ${location}`);
    };

    const onVoice = (p: any) => {
      if (!storage.trackVoice) return;
      if (p.type !== "VOICE_STATE_UPDATE") return;
      const id = p.userId;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(p.channelId);
      if (!c || !shouldNotifyChannel(c)) return;

      let location = "";
      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        location = `${g?.name} #${c.name}`;
      } else if (c.type === 3) {
        location = "group";
      } else {
        location = "DM";
      }
      showToast(`${getName(id)} joined voice in ${location}`);
    };

    FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    FluxDispatcher.subscribe("TYPING_START", onTyping);
    FluxDispatcher.subscribe("VOICE_STATE_UPDATE", onVoice);

    unsubMessage = () => FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
    unsubTyping = () => FluxDispatcher.unsubscribe("TYPING_START", onTyping);
    unsubVoice = () => FluxDispatcher.unsubscribe("VOICE_STATE_UPDATE", onVoice);
  },

  onUnload() {
    unpatchPresence?.();
    unpatchProfile?.();
    unsubMessage?.();
    unsubTyping?.();
    unsubVoice?.();
  },

  settings: Settings,
};

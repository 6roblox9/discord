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
const VoiceStateStore = findByProps("getVoiceStateForUser");

storage.trackFriends ??= true;
storage.userIds ??= [];

storage.trackMessages ??= true;
storage.trackTyping ??= true;
storage.trackProfile ??= true;
storage.trackVoice ??= true;

storage.watchDM ??= true;
storage.watchGroup ??= true;
storage.watchServers ??= true;

const lastStatuses: Record<string, string | undefined> = {};
const lastVoices: Record<string, string | null> = {};

const getTrackedIds = () => {
  const ids = new Set<string>();
  if (storage.trackFriends) {
    for (const id of RelationshipStore.getFriendIDs()) ids.add(id);
  }
  for (const id of storage.userIds) ids.add(id);
  return [...ids];
};

const getName = (id: string) => UserStore.getlegateUser?.(id)?.username ?? UserStore.getUser(id)?.username ?? id;

const channelAllowed = (c: any) => {
  if (!c) return false;
  if (c.guild_id) return storage.watchServers;
  if (c.type === 3) return storage.watchGroup;
  return storage.watchDM;
};

let unpatchPresence: (() => void) | null = null;
let unpatchVoice: (() => void) | null = null;

export default {
  onLoad() {
    for (const id of getTrackedIds()) {
      lastStatuses[id] = PresenceStore.getStatus(id);
      lastVoices[id] = VoiceStateStore.getVoiceStateForUser?.(id)?.channelId ?? null;
    }

    unpatchPresence = after("dispatch", FluxDispatcher, ([p]) => {
      if (p?.type === "PRESENCE_UPDATE" && storage.trackProfile) {
        const id = p.user?.id;
        if (!getTrackedIds().includes(id)) return;
        if (lastStatuses[id] !== p.status) {
          lastStatuses[id] = p.status;
          showToast(`${getName(id)} is now ${p.status}`);
        }
      }

      if (p?.type === "VOICE_STATE_UPDATES" && storage.trackVoice) {
        for (const state of p.voiceStates ?? []) {
          const id = state.userId;
          if (!getTrackedIds().includes(id)) continue;
          const prev = lastVoices[id];
          const now = state.channelId ?? null;
          if (!prev && now) {
            const c = ChannelStore.getChannel(now);
            if (!channelAllowed(c)) continue;
            if (c.guild_id) {
              const g = GuildStore.getGuild(c.guild_id);
              showToast(`${getName(id)} joined voice in ${g?.name}`);
            } else {
              showToast(`${getName(id)} joined voice call`);
            }
          }
          lastVoices[id] = now;
        }
      }
    });

    const onMessage = (p: any) => {
      if (!storage.trackMessages) return;
      const m = p?.message;
      const id = m?.author?.id;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(m.channel_id);
      if (!channelAllowed(c)) return;

      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        showToast(`${getName(id)} messaged in ${g?.name} #${c.name}`);
      } else if (c.type === 3) {
        showToast(`${getName(id)} messaged in group`);
      } else {
        showToast(`${getName(id)} messaged in DM`);
      }
    };

    const onTyping = (p: any) => {
      if (!storage.trackTyping) return;
      const id = p?.userId;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(p.channelId);
      if (!channelAllowed(c)) return;

      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        showToast(`${getName(id)} typing in ${g?.name} #${c.name}`);
      } else if (c.type === 3) {
        showToast(`${getName(id)} typing in group`);
      } else {
        showToast(`${getName(id)} typing in DM`);
      }
    };

    FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    FluxDispatcher.subscribe("TYPING_START", onTyping);

    unpatchVoice = () => {};
  },

  onUnload() {
    unpatchPresence?.();
    unpatchVoice?.();
  },

  settings: Settings,
};

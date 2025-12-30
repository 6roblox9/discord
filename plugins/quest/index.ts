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

const lastStatuses: Record<string, string | undefined> = {};

const getTrackedIds = () => {
  const ids = new Set<string>();
  if (storage.trackFriends) {
    for (const id of RelationshipStore.getFriendIDs()) ids.add(id);
  }
  for (const id of storage.userIds ?? []) ids.add(id);
  return [...ids];
};

let unpatchPresence: (() => void) | null = null;
let unsubMessage: (() => void) | null = null;
let unsubTyping: (() => void) | null = null;

export default {
  onLoad() {
    for (const id of getTrackedIds()) {
      lastStatuses[id] = PresenceStore.getStatus(id);
    }

    unpatchPresence = after("dispatch", FluxDispatcher, ([payload]) => {
      if (payload?.type !== "PRESENCE_UPDATE") return;
      const id = payload.user?.id;
      if (!getTrackedIds().includes(id)) return;
      if (lastStatuses[id] !== payload.status) {
        lastStatuses[id] = payload.status;
        showToast(`user ${id} is now ${payload.status}`);
      }
    });

    const onMessage = (payload: any) => {
      const id = payload?.message?.author?.id;
      if (!getTrackedIds().includes(id)) return;
      showToast(`user ${id} sent a message`);
    };

    const onTyping = (payload: any) => {
      const id = payload?.userId;
      if (!getTrackedIds().includes(id)) return;
      const channel = ChannelStore.getChannel(payload.channelId);
      if (!channel) return;
      if (channel.guild_id) {
        const guild = GuildStore.getGuild(channel.guild_id);
        showToast(`user ${id} typing in ${guild?.name ?? "server"}`);
      } else {
        showToast(`user ${id} typing in DM`);
      }
    };

    FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    FluxDispatcher.subscribe("TYPING_START", onTyping);

    unsubMessage = () => FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
    unsubTyping = () => FluxDispatcher.unsubscribe("TYPING_START", onTyping);
  },

  onUnload() {
    unpatchPresence?.();
    unsubMessage?.();
    unsubTyping?.();
  },

  settings: Settings,
};


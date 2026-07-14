import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import Settings from "./settings";

const FluxDispatcher = findByProps("dispatch", "subscribe");
const PresenceStore = findByProps("getStatus");
const RelationshipStore = findByProps("getFriendIDs");
const ChannelStore = findByProps("getChannel");
const GuildStore = findByProps("getGuild");
const UserStore = findByProps("getUser");
const NotificationManager = findByProps("showNotification");

if (storage.trackFriends === undefined) storage.trackFriends = true;
if (!storage.userIds) storage.userIds = [];

const lastStatuses: Record<string, string | undefined> = {};

const getTrackedIds = () => {
  const ids = new Set<string>();
  if (storage.trackFriends) {
    for (const id of RelationshipStore.getFriendIDs()) ids.add(id);
  }
  for (const id of storage.userIds) ids.add(id);
  return [...ids];
};

const getName = (id: string) => UserStore.getUser(id)?.username ?? id;

const getIcon = (id: string) => UserStore.getUser(id)?.getAvatarURL?.() ?? undefined;

const notify = (id: string, body: string) => {
  if (NotificationManager?.showNotification) {
    NotificationManager.showNotification({
      title: getName(id),
      body: body,
      icon: getIcon(id)
    });
  }
};

let unpatchPresence: (() => void) | null = null;
let unsubMessage: (() => void) | null = null;
let unsubTyping: (() => void) | null = null;

export default {
  onLoad() {
    for (const id of getTrackedIds()) {
      lastStatuses[id] = PresenceStore.getStatus(id);
    }

    unpatchPresence = after("dispatch", FluxDispatcher, ([p]) => {
      if (p?.type !== "PRESENCE_UPDATE") return;
      const id = p.user?.id;
      if (!getTrackedIds().includes(id)) return;
      if (lastStatuses[id] !== p.status) {
        lastStatuses[id] = p.status;
        notify(id, `is now ${p.status}`);
      }
    });

    const onMessage = (p: any) => {
      const m = p?.message;
      const id = m?.author?.id;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(m.channel_id);
      if (!c) return;

      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        notify(id, `messaged in ${g?.name} #${c.name}`);
      } else if (c.type === 3) {
        notify(id, `messaged in group`);
      } else {
        notify(id, `messaged in DM`);
      }
    };

    const onTyping = (p: any) => {
      const id = p?.userId;
      if (!getTrackedIds().includes(id)) return;
      const c = ChannelStore.getChannel(p.channelId);
      if (!c) return;

      if (c.guild_id) {
        const g = GuildStore.getGuild(c.guild_id);
        notify(id, `typing in ${g?.name} #${c.name}`);
      } else if (c.type === 3) {
        notify(id, `typing in group`);
      } else {
        notify(id, `typing in DM`);
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

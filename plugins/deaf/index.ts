import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const UserStore = findByProps("getCurrentUser");
const APIUtils = findByProps("getAPIBaseURL", "patch");
const upload = findByProps("uploadFile");

async function fetchJSON(url) {
  const r = await fetch(url);
  return await r.json();
}

async function sendJSON(channelId, data) {
  const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  await upload.upload({
    channelId,
    file,
    filename: "profile.json"
  });
}

async function applyProfile(data) {
  await APIUtils.patch({
    url: "/users/@me",
    body: {
      username: data.username,
      global_name: data.global_name,
      bio: data.bio,
      pronouns: data.pronouns
    }
  });
  if ("avatar" in data) {
    await APIUtils.patch({ url: "/users/@me", body: { avatar: data.avatar } });
  }
  if ("banner" in data) {
    await APIUtils.patch({ url: "/users/@me", body: { banner: data.banner } });
  }
}

function getProfile() {
  const u = UserStore.getCurrentUser();
  return {
    username: u.username,
    global_name: u.globalName,
    bio: u.bio,
    pronouns: u.pronouns,
    avatar: u.avatar,
    banner: u.banner
  };
}

export default {
  onLoad() {
    registerCommand({
      name: "profile",
      description: "Save / Load profile",
      options: [
        {
          name: "action",
          description: "save or load",
          type: 3,
          required: true
        },
        {
          name: "link",
          description: "raw json link",
          type: 3,
          required: false
        }
      ],
      execute: async (args, ctx) => {
        const action = args.action;
        const link = args.link;
        if (action === "save" && !link) {
          const data = getProfile();
          await sendJSON(ctx.channel.id, data);
          showToast("Profile saved");
        }
        if (action === "load" && link) {
          const data = await fetchJSON(link);
          await applyProfile(data);
          showToast("Profile loaded");
        }
        if (action === "save" && link) {
          const data = await fetchJSON(link);
          await sendJSON(ctx.channel.id, data);
          showToast("JSON sent");
        }
      }
    });
  },
  onUnload() {
    unregisterAllCommands();
  }
};

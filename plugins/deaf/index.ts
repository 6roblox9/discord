import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const APIUtils = findByProps("getAPIBaseURL", "patch", "post", "get");

function getArg(args, name) {
  return args.find(a => a.name === name)?.value;
}

async function sendMessage(channelId, content) {
  await APIUtils.post({
    url: `/channels/${channelId}/messages`,
    body: { content }
  });
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to fetch JSON");
  return await r.json();
}

async function getProfile() {
  const profile = await APIUtils.get({ url: "/users/@me/profile" });
  return {
    username: profile.user.username,
    global_name: profile.user.global_name,
    bio: profile.bio,
    pronouns: profile.pronouns,
    accent_color: profile.accent_color,
    theme_colors: profile.theme_colors
  };
}

async function applyProfile(data) {
  await APIUtils.patch({
    url: "/users/@me",
    body: {
      username: data.username,
      global_name: data.global_name
    }
  });

  await APIUtils.patch({
    url: "/users/@me/profile",
    body: {
      bio: data.bio ?? "",
      pronouns: data.pronouns ?? "",
      accent_color: data.accent_color ?? null,
      theme_colors: data.theme_colors ?? null
    }
  });
}

export default {
  onLoad() {
    registerCommand({
      name: "profile",
      description: "Save / Load profile",
      options: [
        { name: "action", type: 3, required: true },
        { name: "link", type: 3, required: false }
      ],
      execute: async (args, ctx) => {
        try {
          const action = getArg(args, "action")?.toLowerCase();
          const link = getArg(args, "link");

          if (action === "save" && !link) {
            const data = await getProfile();
            await sendMessage(
              ctx.channel.id,
              "```json\n" + JSON.stringify(data, null, 2) + "\n```"
            );
            showToast("Profile saved");
            return;
          }

          if (action === "load" && link) {
            const data = await fetchJSON(link);
            await applyProfile(data);
            showToast("Profile loaded");
            return;
          }

          if (action === "save" && link) {
            const data = await fetchJSON(link);
            await sendMessage(
              ctx.channel.id,
              "```json\n" + JSON.stringify(data, null, 2) + "\n```"
            );
            showToast("JSON sent");
            return;
          }

          throw new Error("Invalid arguments");
        } catch (e) {
          await sendMessage(ctx.channel.id, `❌ Error: ${e.message}`);
          showToast("Profile error");
        }
      }
    });
  },
  onUnload() {
    unregisterAllCommands();
  }
};

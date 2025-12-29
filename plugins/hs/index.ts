import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./settings";

const getToken = findByProps("getToken").getToken;

function request(method: string, body?: any) {
  const token = getToken();
  if (!token) {
    showToast("Failed to get token");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "User-Agent": "Discord-Android/305012;RNA"
    },
    body: body ? JSON.stringify(body) : undefined
  })
    .then(r => {
      if (!r.ok) showToast(`Request failed: ${r.status}`);
    })
    .catch(e => showToast(`Error: ${e.message}`));
}

function applyHouse(value: string) {
  if (value === "4") {
    request("DELETE");
    showToast("HypeSquad removed");
    return;
  }

  const id = Number(value);
  if (![1, 2, 3].includes(id)) {
    showToast("Invalid selection");
    return;
  }

  request("POST", { house_id: id });
  showToast(`HypeSquad set to ${id}`);
}

export const loadCommands = () => {
  registerCommand({
    name: "hypesquad",
    description: "Set or remove your HypeSquad badge",
    options: [
      {
        name: "type",
        description: "Choose a HypeSquad house",
        type: 3,
        required: true,
        choices: [
          { name: "Bravery House", value: "1" },
          { name: "Brilliance House", value: "2" },
          { name: "Balance House", value: "3" },
          { name: "Remove Badge", value: "4" }
        ]
      }
    ],
    execute: (args) => applyHouse(args.type)
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


import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { storage } from "@vendetta/plugin";
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
      "Authorization": token,
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

function setHouse(id: number) {
  request("POST", { house_id: id });
  const names = ["Remove", "Bravery", "Brilliance", "Balance"];
  showToast(`HypeSquad set to ${names[id] ?? id}`);
}

function removeHouse() {
  request("DELETE");
  showToast("HypeSquad removed");
}

export const loadCommands = () => {
  registerCommand({
    name: "hypesquad",
    description: "Set or remove your HypeSquad badge",
    options: [
      {
        name: "type",
        description: "Select HypeSquad house or remove",
        type: 3, // STRING type
        required: true,
        choices: [
          { name: "Bravery", value: "1" },
          { name: "Brilliance", value: "2" },
          { name: "Balance", value: "3" },
          { name: "Remove", value: "0" }
        ]
      }
    ],
    execute: (args) => {
      const val = Number(args.type);
      if (val === 0) removeHouse();
      else setHouse(val);
    }
  });
};

export const unloadCommands = () => unregisterAllCommands();

export default {
  onLoad() {
    loadCommands();
    if (storage.autoApply && [1, 2, 3].includes(storage.defaultHouse)) {
      setHouse(storage.defaultHouse);
    }
  },
  onUnload() {
    unloadCommands();
  },
  settings: Settings
};


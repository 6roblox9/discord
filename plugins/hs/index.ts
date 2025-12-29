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
  }).then(r => {
    if (!r.ok) showToast(`Request failed: ${r.status}`);
  }).catch(e => showToast(`Error: ${e.message}`));
}

function applyHouse(args: any) {
  const raw =
    args?.type ??
    args?.[0]?.value ??
    args?.[0] ??
    args;

  const value = Number(raw);

  if (!Number.isInteger(value)) {
    showToast("Use 0, 1, 2 or 3");
    return;
  }

  if (value === 0) {
    request("DELETE");
    showToast("HypeSquad removed");
    return;
  }

  if (![1, 2, 3].includes(value)) {
    showToast("Use 0, 1, 2 or 3");
    return;
  }

  request("POST", { house_id: value });

  const names: Record<number, string> = {
    1: "Bravery",
    2: "Brilliance",
    3: "Balance"
  };

  showToast(`HypeSquad set to ${names[value]}`);
}

export const loadCommands = () => {
  registerCommand({
    name: "hypesquad",
    description: "Apply or remove your HypeSquad badge",
    options: [
      {
        name: "type",
        description: "0 remove | 1 bravery | 2 brilliance | 3 balance",
        type: 4,
        required: true
      }
    ],
    execute: (args) => applyHouse(args)
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

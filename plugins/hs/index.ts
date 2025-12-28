import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const getToken = findByProps("getToken").getToken;

function setHouse(id: number) {
  const token = getToken();
  if (!token) {
    showToast("Failed to get token");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json",
      "User-Agent": "Discord-Android/305012;RNA"
    },
    body: JSON.stringify({ house_id: id })
  })
    .then(r => {
      if (r.ok) showToast(`HypeSquad set to ${id}`);
      else showToast(`Failed: ${r.status}`);
    })
    .catch(e => showToast(`Error: ${e.message}`));
}

function removeHouse() {
  const token = getToken();
  if (!token) {
    showToast("Failed to get token");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method: "DELETE",
    headers: {
      "Authorization": token,
      "User-Agent": "Discord-Android/305012;RNA"
    }
  })
    .then(r => {
      if (r.ok) showToast("HypeSquad removed");
      else showToast(`Failed: ${r.status}`);
    })
    .catch(e => showToast(`Error: ${e.message}`));
}

export const loadCommands = () => {
  registerCommand({
    name: "hs1",
    description: "Set HypeSquad House 1",
    options: [],
    execute: () => setHouse(1),
  });

  registerCommand({
    name: "hs2",
    description: "Set HypeSquad House 2",
    options: [],
    execute: () => setHouse(2),
  });

  registerCommand({
    name: "hs3",
    description: "Set HypeSquad House 3",
    options: [],
    execute: () => setHouse(3),
  });

  registerCommand({
    name: "hsr",
    description: "Remove HypeSquad",
    options: [],
    execute: () => removeHouse(),
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
};


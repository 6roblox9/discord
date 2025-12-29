import { findByProps } from "@vendetta/metro";
import Settings from "./settings";
import { runQuests } from "./quests";
import { storage } from "@vendetta/plugin";

const getToken = findByProps("getToken").getToken;

let started = false;

async function boot() {
  if (started) return;
  started = true;
  storage.logs = [];
  storage.logs.push("Plugin loaded");

  const token = getToken();
  if (!token) {
    storage.logs.push("Failed to get token");
    started = false;
    return;
  }

  storage.logs.push("Token acquired");
  const ran = await runQuests(token);

  if (!ran) storage.logs.push("No quests available");
  else storage.logs.push("All quests completed");

  started = false;
}

export default {
  onLoad() {
    boot();
  },
  onUnload() {
    started = false;
  },
  settings: Settings
};


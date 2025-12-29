import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./settings";
import { runQuests } from "./quests";

const getToken = findByProps("getToken").getToken;

let running = false;

async function start() {
  if (running) return;
  running = true;
  const token = getToken();
  if (!token) {
    running = false;
    return;
  }
  const didRun = await runQuests(token);
  if (!didRun) showToast("No quests found");
  running = false;
}

export default {
  onLoad() {
    start();
  },
  onUnload() {
    running = false;
  },
  settings: Settings
};

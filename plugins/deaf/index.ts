import { findByProps } from "@vendetta/metro";
import { patcher } from "@vendetta/patcher";

const VoiceStateUpdate = findByProps("updateSelfDeaf", "updateSelfMute");

let patches = [];

export default {
  onLoad: () => {
    patches.push(
      patcher.before("updateSelfDeaf", VoiceStateUpdate, (args) => {
        args[0] = true;
      })
    );
    patches.push(
      patcher.before("updateSelfMute", VoiceStateUpdate, (args) => {
        args[0] = false;
      })
    );
  },
  onUnload: () => {
    for (const unpatch of patches) unpatch();
  }
};

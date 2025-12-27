import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

const VoiceState = findByProps("updateSelfDeaf");
const Audio = findByProps(
  "setLocalMute",
  "setLocalDeaf",
  "setSelfDeaf",
  "setSelfMute",
  "setInputVolume",
  "setOutputVolume"
);

const unpatches = [];

if (VoiceState) {
  unpatches.push(
    before("updateSelfDeaf", VoiceState, (args) => {
      args[0] = true;
      return args;
    })
  );
}

if (Audio) {
  Object.keys(Audio).forEach(k => {
    if (typeof Audio[k] === "function") {
      unpatches.push(
        before(k, Audio, () => false)
      );
    }
  });
}

export const onUnload = () => {
  unpatches.forEach(u => u());
};


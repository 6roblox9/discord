import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

const VoiceState = findByProps("updateSelfDeaf");
const MediaEngine = findByProps("setSelfDeaf", "setSelfMute");

const unpatches = [];

if (VoiceState) {
    unpatches.push(
        before("updateSelfDeaf", VoiceState, (args) => {
            args[0] = true; // السيرفر يشوفك ديفين
            return args;
        })
    );
}

if (MediaEngine) {
    unpatches.push(
        before("setSelfDeaf", MediaEngine, () => {
            return false; // لا تكتم الصوت محليًا
        })
    );
}

export const onUnload = () => {
    unpatches.forEach(u => u());
};

import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";

const VoiceStateUpdate = findByProps("updateSelfDeaf", "updateSelfMute");
const unpatches: (() => void)[] = [];

try {
    if (VoiceStateUpdate) {
        unpatches.push(
            before("updateSelfDeaf", VoiceStateUpdate, (args) => {
                args[0] = true;
                return args;
            })
        );

        unpatches.push(
            before("updateSelfMute", VoiceStateUpdate, (args) => {
                args[0] = false;
                return args;
            })
        );
    }
} catch (e) {}

export const onUnload = () => {
    for (const unpatch of unpatches) {
        unpatch();
    }
};


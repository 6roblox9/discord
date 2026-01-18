import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import Settings from "./settings";

const GatewayConnectionSocket = findByProps("voiceStateUpdate", "voiceServerPing");

let unpatch: () => void;

export default {
    onLoad: () => {
        unpatch = before("voiceStateUpdate", GatewayConnectionSocket.prototype, (args) => {
            const { fakeMute, fakeDeaf, fakeVideo } = storage;
            const voiceStateUpdateArgs = args[0];

            if (fakeMute) {
                voiceStateUpdateArgs.selfMute = true;
            }
            if (fakeDeaf) {
                voiceStateUpdateArgs.selfDeaf = true;
            }
            if (fakeVideo) {
                voiceStateUpdateArgs.selfVideo = true;
            }
        });
    },
    onUnload: () => {
        unpatch();
    },
    settings: Settings,
};

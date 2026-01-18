import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import Settings from "./settings";

const GatewayConnectionSocket = findByProps("voiceStateUpdate", "voiceServerPing");

let unpatch: () => void;

export default {
    onLoad: () => {
        if (GatewayConnectionSocket?.prototype) {
            unpatch = before("voiceStateUpdate", GatewayConnectionSocket.prototype, (args) => {
                const voiceStateUpdateArgs = args[0];
                if (storage.fakeMute) voiceStateUpdateArgs.selfMute = true;
                if (storage.fakeDeaf) voiceStateUpdateArgs.selfDeaf = true;
                if (storage.fakeVideo) voiceStateUpdateArgs.selfVideo = true;
            });
        }
    },
    onUnload: () => {
        unpatch?.();
    },
    settings: Settings,
};

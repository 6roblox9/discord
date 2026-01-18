import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import Settings from "./settings";

const GatewayConnectionSocket = findByProps("voiceStateUpdate", "voiceServerPing");

let unpatch: () => void;

export default {
    onLoad() {
        if (!GatewayConnectionSocket?.prototype) return;

        unpatch = before(
            "voiceStateUpdate",
            GatewayConnectionSocket.prototype,
            (args) => {
                const data = args[0];
                if (storage.fakeMute) data.selfMute = true;
                if (storage.fakeDeaf) data.selfDeaf = true;
                if (storage.fakeVideo) data.selfVideo = true;
            }
        );
    },
    onUnload() {
        unpatch?.();
    },
    settings: Settings
};

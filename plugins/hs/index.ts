import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { before } from "@vendetta/patcher";
import Settings from "./settings";

const GatewayConnectionSocket = findByProps("send", "handlePacket");

let unpatch: () => void;

export default {
    onLoad() {
        if (!GatewayConnectionSocket?.prototype) return;

        unpatch = before(
            "send",
            GatewayConnectionSocket.prototype,
            (args) => {
                const packet = args[0];
                if (!packet || packet.op !== 4 || !packet.d) return;

                if (storage.fakeMute) packet.d.self_mute = true;
                if (storage.fakeDeaf) packet.d.self_deaf = true;
                if (storage.fakeVideo) packet.d.self_video = true;
            }
        );
    },
    onUnload() {
        unpatch?.();
    },
    settings: Settings
};

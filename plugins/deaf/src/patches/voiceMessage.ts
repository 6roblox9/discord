import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";

function fakeWaveform(duration: number) {
    const points = Math.min(120, Math.floor(duration * 2));
    const arr = Array.from({ length: points }, () =>
        Math.floor(Math.random() * 255)
    );
    return btoa(String.fromCharCode(...arr));
}

function transform(item: any) {
    if (item?.mimeType?.startsWith("audio")) {
        item.mimeType = "audio/ogg";
        item.waveform = fakeWaveform(60.0);
        item.durationSecs = 60.0;
    }
}

export default () => {
    const unpatches: (() => void)[] = [];

    const patch = (method: string) => {
        try {
            const module = findByProps(method);
            const unpatch = before(method, module, (args) => {
                const upload = args[0];
                if (!storage.sendAsVM || upload.flags === 8192) return;
                const item = upload.items?.[0] ?? upload;
                if (item?.mimeType?.startsWith("audio")) {
                    transform(item);
                    upload.flags = 8192;
                }
            });
            unpatches.push(unpatch);
        } catch {}
    };

    patch("uploadLocalFiles");
    patch("CloudUpload");

    return () => unpatches.forEach((u) => u());
};

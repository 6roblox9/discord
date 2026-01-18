import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { FormSwitchRow } from "@vendetta/ui/components";

import { findByProps } from "@vendetta/metro";
const { ScrollView } = findByProps("ScrollView");

export default () => {
    useProxy(storage);

    return (
        <ScrollView>
            <FormSwitchRow
                label="Fake Mute"
                subLabel="Show others you are muted, but you can still talk."
                value={storage.fakeMute ?? false}
                onValueChange={(v) => storage.fakeMute = v}
            />
            <FormSwitchRow
                label="Fake Deafened"
                subLabel="Show others you are deafened, but you can still hear."
                value={storage.fakeDeaf ?? false}
                onValueChange={(v) => storage.fakeDeaf = v}
            />
            <FormSwitchRow
                label="Fake Video Off"
                subLabel="Show others your video is off, but you can still stream."
                value={storage.fakeVideo ?? false}
                onValueChange={(v) => storage.fakeVideo = v}
            />
        </ScrollView>
    );
};

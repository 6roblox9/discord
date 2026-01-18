import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { FormSwitchRow } from "@vendetta/ui/components";

export default () => {
    const [fakeMute, setFakeMute] = React.useState(storage.fakeMute ?? false);
    const [fakeDeaf, setFakeDeaf] = React.useState(storage.fakeDeaf ?? false);
    const [fakeVideo, setFakeVideo] = React.useState(storage.fakeVideo ?? false);

    return (
        <RN.ScrollView>
            <FormSwitchRow
                label="Fake Mute"
                subLabel="Show others you are muted, but you can still talk (locally unmuted)."
                value={fakeMute}
                onValueChange={(value) => {
                    setFakeMute(value);
                    storage.fakeMute = value;
                }}
            />
            <FormSwitchRow
                label="Fake Deafened"
                subLabel="Show others you are deafened, but you can still hear them."
                value={fakeDeaf}
                onValueChange={(value) => {
                    setFakeDeaf(value);
                    storage.fakeDeaf = value;
                }}
            />
            <FormSwitchRow
                label="Fake Video Off"
                subLabel="Show others your video is off, but you can still stream."
                value={fakeVideo}
                onValueChange={(value) => {
                    setFakeVideo(value);
                    storage.fakeVideo = value;
                }}
            />
        </RN.ScrollView>
    );
};

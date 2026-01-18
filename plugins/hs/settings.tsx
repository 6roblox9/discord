import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { findByProps } from "@vendetta/metro";

const { ScrollView } = findByProps("ScrollView");
const { TableSwitchRow, TableRowGroup, Stack } = findByProps(
    "TableSwitchRow",
    "TableRowGroup",
    "Stack"
);

export default function Settings() {
    useProxy(storage);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Fake Voice States">
                    <TableSwitchRow
                        label="Fake Mute"
                        subLabel="Others see you muted while you can still talk"
                        value={storage.fakeMute ?? false}
                        onValueChange={(v: boolean) => storage.fakeMute = v}
                    />
                    <TableSwitchRow
                        label="Fake Deafened"
                        subLabel="Others see you deafened while you still hear"
                        value={storage.fakeDeaf ?? false}
                        onValueChange={(v: boolean) => storage.fakeDeaf = v}
                    />
                    <TableSwitchRow
                        label="Fake Video Off"
                        subLabel="Others see your camera off while you still stream"
                        value={storage.fakeVideo ?? false}
                        onValueChange={(v: boolean) => storage.fakeVideo = v}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

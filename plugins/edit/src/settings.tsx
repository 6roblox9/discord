import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { useProxy } from "@vendetta/storage";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableSwitchRow } = findByProps("TableSwitchRow", "TableRowGroup");

export default function Settings() {
    useProxy(storage);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <TableRowGroup>
                <TableSwitchRow
                    label="Inject Original Edit"
                    subLabel="Replace original edit with silent edit."
                    value={storage.overrideNative ?? true}
                    onValueChange={(val: boolean) => {
                        storage.overrideNative = val;
                    }}
                />
            </TableRowGroup>
        </ScrollView>
    );
}

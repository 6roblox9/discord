import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { useProxy } from "@vendetta/storage";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableSwitchRow } = findByProps(
    "TableSwitchRow",
    "TableCheckboxRow",
    "TableRowGroup"
);

if (storage.injectOriginalEdit === undefined) storage.injectOriginalEdit = true;

export default function Settings() {
    useProxy(storage);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <TableRowGroup title="Edit Behavior">
                <TableSwitchRow
                    label="Inject Original Edit"
                    subLabel="Replace original edit with silent edit. Disable for separate button."
                    value={storage.injectOriginalEdit}
                    onValueChange={(value: boolean) => {
                        storage.injectOriginalEdit = value;
                    }}
                />
            </TableRowGroup>
        </ScrollView>
    );
}

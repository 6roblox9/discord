import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableSwitchRow, Stack } =
  findByProps("TableSwitchRow", "TableRowGroup", "Stack");
const { TextInput } = findByProps("TextInput");

const get = (k: string, f: any = null) => storage[k] ?? f;
const set = (k: string, v: any) => (storage[k] = v);

export default function Settings() {
  const [, forceUpdate] = React.useReducer(x => ~x, 0);
  const update = () => forceUpdate();

  const house = get("defaultHouse", "1");

  return (
    <ScrollView style={{ flex: 1 }}>
      <Stack spacing={10} style={{ padding: 10 }}>

        <TableRowGroup title="HypeSquad Settings">
          <TableSwitchRow
            label="Auto apply on load"
            subLabel="Apply selected house when plugin loads"
            value={!!get("autoApply")}
            onValueChange={(v) => {
              set("autoApply", v);
              update();
            }}
          />
        </TableRowGroup>

        <TableRowGroup title="Default HypeSquad House">
          <Stack spacing={4}>
            <TextInput
              placeholder="1 / 2 / 3"
              value={house}
              onChange={(v) => {
                if (!["1", "2", "3"].includes(v)) return;
                set("defaultHouse", Number(v));
                update();
              }}
              isClearable
            />
          </Stack>
        </TableRowGroup>

      </Stack>
    </ScrollView>
  );
}

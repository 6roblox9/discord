import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { findByProps } from "@vendetta/metro";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableRow, Stack } = findByProps(
  "TableRowGroup",
  "TableRow",
  "Stack"
);

storage.platform ??= "desktop";

const options = [
  { label: "Desktop", value: "desktop" },
  { label: "Web", value: "web" },
  { label: "Android", value: "android" },
  { label: "iOS", value: "ios" },
  { label: "Xbox", value: "xbox" },
  { label: "Playstation", value: "playstation" },
];

export default function Settings() {
  useProxy(storage);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>
        <TableRowGroup title="Platform Spoofer">
          {options.map((o) => (
            <TableRow
              key={o.value}
              label={o.label}
              trailing={storage.platform === o.value ? <TableRow.Checkmark /> : null}
              onPress={() => (storage.platform = o.value)}
            />
          ))}
        </TableRowGroup>

        <TableRowGroup title="Notice">
          <TableRow
            label="Warning"
            subLabel="Spoofing platform may lead to warnings or bans"
          />
          <TableRow
            label="Restart Required"
            subLabel="Restart Discord after changing platform"
          />
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}

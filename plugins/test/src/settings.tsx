import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { useProxy } from "@vendetta/storage";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableSwitchRow, Stack } = findByProps(
  "TableSwitchRow",
  "TableRowGroup",
  "Stack"
);

storage.trackFriends ??= true;
storage.trackMessages ??= true;
storage.trackTyping ??= true;
storage.trackProfile ??= true;
storage.trackVoice ??= true;

storage.watchDM ??= true;
storage.watchGroup ??= true;
storage.watchServers ??= true;

export default function Settings() {
  useProxy(storage);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>
        <TableRowGroup title="Tracking Events">
          <TableSwitchRow label="Track Profile Changes" value={storage.trackProfile} onValueChange={v => storage.trackProfile = v} />
          <TableSwitchRow label="Track Started Typing" value={storage.trackTyping} onValueChange={v => storage.trackTyping = v} />
          <TableSwitchRow label="Track Sent Message" value={storage.trackMessages} onValueChange={v => storage.trackMessages = v} />
          <TableSwitchRow label="Track Voice Join" value={storage.trackVoice} onValueChange={v => storage.trackVoice = v} />
        </TableRowGroup>

        <TableRowGroup title="Channel Scope">
          <TableSwitchRow label="DM" value={storage.watchDM} onValueChange={v => storage.watchDM = v} />
          <TableSwitchRow label="Group DM" value={storage.watchGroup} onValueChange={v => storage.watchGroup = v} />
          <TableSwitchRow label="Servers" value={storage.watchServers} onValueChange={v => storage.watchServers = v} />
        </TableRowGroup>

        <TableRowGroup title="Users">
          <TableSwitchRow label="Track Friends" value={storage.trackFriends} onValueChange={v => storage.trackFriends = v} />
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}

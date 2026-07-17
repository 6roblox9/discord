import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { useProxy } from "@vendetta/storage";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableSwitchRow, Stack, TextInput } = findByProps(
  "TableSwitchRow",
  "TableRowGroup",
  "Stack",
  "TableRow"
);
const { Text } = findByProps("Text", "View");

export default function Settings() {
  useProxy(storage);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>
        <TableRowGroup title="Keyword Setup">
          <Stack spacing={4} style={{ padding: 10 }}>
            <TextInput
              placeholder="Enter keyword or phrase to track..."
              value={storage.keyword}
              onChange={(v: string) => (storage.keyword = v)}
            />
          </Stack>
        </TableRowGroup>

        <TableRowGroup title="Tracking Locations">
          <TableSwitchRow
            label="Track Servers"
            value={storage.trackServers}
            onValueChange={(v: boolean) => (storage.trackServers = v)}
          />
          <TableSwitchRow
            label="Track Group DMs"
            value={storage.trackGroups}
            onValueChange={(v: boolean) => (storage.trackGroups = v)}
          />
          <TableSwitchRow
            label="Track DMs"
            value={storage.trackDMs}
            onValueChange={(v: boolean) => (storage.trackDMs = v)}
          />
        </TableRowGroup>

        <TableRowGroup title="Matching Rules">
          <TableSwitchRow
            label="Exact Match"
            subLabel="Message must be exactly the keyword"
            value={storage.exactMatch}
            onValueChange={(v: boolean) => (storage.exactMatch = v)}
          />
          <TableSwitchRow
            label="Case Sensitive"
            subLabel="Match exact uppercase and lowercase letters"
            value={storage.caseSensitive}
            onValueChange={(v: boolean) => (storage.caseSensitive = v)}
          />
          <TableSwitchRow
            label="Match in a Sentence"
            subLabel="Keyword can be part of a larger sentence"
            value={storage.inSentence}
            onValueChange={(v: boolean) => (storage.inSentence = v)}
          />
        </TableRowGroup>

        <TableRowGroup title="Advanced Notifications">
          <TableSwitchRow
            label="Send Notifications to Channel"
            subLabel="Forward detected messages to a specific channel"
            value={storage.sendNotificationToChannel}
            onValueChange={(v: boolean) => (storage.sendNotificationToChannel = v)}
          />
          {storage.sendNotificationToChannel && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <Text style={{ color: "#f23f42", fontSize: 12, marginBottom: 4, fontWeight: "bold" }}>
                WARNING: You must own the target channel to maintain privacy and prevent spamming others.
              </Text>
              <TextInput
                placeholder="Enter Target Channel ID..."
                value={storage.targetChannelId}
                onChange={(v: string) => (storage.targetChannelId = v)}
              />
            </Stack>
          )}
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}

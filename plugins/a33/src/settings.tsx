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

        <TableRowGroup title="Tracking Target">
          <TableSwitchRow
            label="Track Everyone"
            value={storage.trackMode === "everyone"}
            onValueChange={() => (storage.trackMode = "everyone")}
          />
          <TableSwitchRow
            label="Track Friends Only"
            value={storage.trackMode === "friends"}
            onValueChange={() => (storage.trackMode = "friends")}
          />
          <TableSwitchRow
            label="Track Custom Users"
            value={storage.trackMode === "custom"}
            onValueChange={() => (storage.trackMode = "custom")}
          />
          {storage.trackMode === "custom" && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <TextInput
                placeholder="123456789, 987654321"
                value={storage.customIds}
                onChange={(v: string) => (storage.customIds = v)}
              />
            </Stack>
          )}
        </TableRowGroup>

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
            value={storage.exactMatch}
            onValueChange={(v: boolean) => (storage.exactMatch = v)}
          />
          <TableSwitchRow
            label="Case Sensitive"
            value={storage.caseSensitive}
            onValueChange={(v: boolean) => (storage.caseSensitive = v)}
          />
          <TableSwitchRow
            label="Match in a Sentence"
            value={storage.inSentence}
            onValueChange={(v: boolean) => (storage.inSentence = v)}
          />
        </TableRowGroup>

        <TableRowGroup title="Advanced Notifications">
          <TableSwitchRow
            label="Send Notifications to Channel"
            value={storage.sendNotificationToChannel}
            onValueChange={(v: boolean) => (storage.sendNotificationToChannel = v)}
          />
          {storage.sendNotificationToChannel && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <TextInput
                placeholder="Enter Target Channel ID..."
                value={storage.targetChannelId}
                onChange={(v: string) => (storage.targetChannelId = v)}
              />
              <Text style={{ color: "#f23f42", fontSize: 12, marginTop: 4, fontWeight: "bold" }}>
                WARNING: You must own the target channel to maintain privacy and prevent spamming others.
              </Text>
            </Stack>
          )}
        </TableRowGroup>

      </Stack>
    </ScrollView>
  );
}

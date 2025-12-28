import { React } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { Button } from "$/lib/redesign";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, Stack } =
  findByProps("TableRowGroup", "Stack");
const { TextInput } = findByProps("TextInput");
const getToken = findByProps("getToken").getToken;

function applyValue(value: number) {
  const token = getToken();
  if (!token) {
    showToast("Failed to get token");
    return;
  }

  if (value === 0) {
    fetch("https://discord.com/api/v9/hypesquad/online", {
      method: "DELETE",
      headers: {
        Authorization: token,
        "User-Agent": "Discord-Android/305012;RNA",
      },
    }).then(r =>
      showToast(r.ok ? "HypeSquad removed" : `Failed: ${r.status}`)
    );
    return;
  }

  if (![1, 2, 3].includes(value)) {
    showToast("Only 0, 1, 2 or 3 are allowed");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "User-Agent": "Discord-Android/305012;RNA",
    },
    body: JSON.stringify({ house_id: value }),
  }).then(r =>
    showToast(r.ok ? `HypeSquad set to ${value}` : `Failed: ${r.status}`)
  );
}

export default function Settings() {
  const [, forceUpdate] = React.useReducer(x => ~x, 0);
  const update = () => forceUpdate();

  const value = storage.hsValue ?? "";

  return (
    <ScrollView style={{ flex: 1 }}>
      <Stack spacing={10} style={{ padding: 10 }}>

        <TableRowGroup title="HypeSquad">
          <TextInput
            placeholder="0 = remove, 1-3 = house"
            value={String(value)}
            onChange={(v) => {
              storage.hsValue = v;
              update();
            }}
            isClearable
          />
        </TableRowGroup>

        <Button
          text="Apply"
          variant="primary"
          size="md"
          onPress={() => applyValue(Number(storage.hsValue))}
        />

      </Stack>
    </ScrollView>
  );
}


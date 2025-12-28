
// settings.tsx
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const getToken = () => {
  try {
    return require("@vendetta/metro").findByProps("getToken").getToken();
  } catch { return null; }
};

function applyValue(value: number) {
  const token = getToken();
  if (!token) return showToast("Failed to get token");

  if (value === 0) {
    fetch("https://discord.com/api/v9/hypesquad/online", {
      method: "DELETE",
      headers: { Authorization: token },
    }).then(r => showToast(r.ok ? "HypeSquad removed" : `Failed: ${r.status}`));
    return;
  }

  if (![1, 2, 3].includes(value)) {
    showToast("Only 0-3 allowed");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ house_id: value }),
  }).then(r => showToast(r.ok ? `HypeSquad set to ${value}` : `Failed: ${r.status}`));
}

export default function Settings() {
  const [val, setVal] = React.useState(storage.hsValue ?? "");

  return (
    <RN.ScrollView style={{ flex: 1, padding: 12 }}>
      <RN.View style={{ marginBottom: 12 }}>
        <RN.TextInput
          placeholder="0 = remove, 1-3 = house"
          value={val}
          onChangeText={setVal}
          style={{ borderWidth: 1, borderColor: "#555", padding: 8, borderRadius: 6, color: "#fff" }}
        />
      </RN.View>

      <RN.Button
        title="Apply"
        onPress={() => {
          storage.hsValue = val;
          applyValue(Number(val));
        }}
      />
    </RN.ScrollView>
  );
}

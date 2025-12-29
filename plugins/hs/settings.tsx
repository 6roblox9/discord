import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const getToken = findByProps("getToken").getToken;

function applyValue(value: number) {
  const token = getToken();
  if (!token) return showToast("Failed to get token");

  if (value === 0) {
    fetch("https://discord.com/api/v9/hypesquad/online", {
      method: "DELETE",
      headers: { Authorization: token },
    })
      .then(res => showToast(res.ok ? "HypeSquad removed" : `Failed: ${res.status}`))
      .catch(e => showToast(`Error: ${e.message}`));
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
  })
    .then(res => showToast(res.ok ? `HypeSquad set to ${value}` : `Failed: ${res.status}`))
    .catch(e => showToast(`Error: ${e.message}`));
}

export default function Settings() {
  const [val, setVal] = React.useState(storage.hsValue ?? "");

  return (
    <RN.ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#2f3136" }}>
      <RN.View style={{ marginBottom: 12 }}>
        <RN.TextInput
          placeholder="Enter 0-3"
          placeholderTextColor="#ccc"
          value={val}
          onChangeText={setVal}
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#7289da",
            padding: 10,
            borderRadius: 8,
            color: "#fff",
            fontSize: 16,
            backgroundColor: "#202225",
          }}
        />
      </RN.View>

      <RN.TouchableOpacity
        onPress={() => {
          storage.hsValue = val;
          applyValue(Number(val));
        }}
        style={{
          backgroundColor: "#7289da",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <RN.Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          Apply
        </RN.Text>
      </RN.TouchableOpacity>

      <RN.View>
        <RN.Text style={{ color: "#fff", fontSize: 16, marginBottom: 6 }}>
          💡 <RN.Text style={{ color: "#faa81a" }}>Instructions:</RN.Text>
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          - Use <RN.Text style={{ color: "#00bfff" }}>commands</RN.Text> in Discord: <RN.Text style={{ color: "#ff6b81" }}>/hs1</RN.Text>, <RN.Text style={{ color: "#ff6b81" }}>/hs2</RN.Text>, <RN.Text style={{ color: "#ff6b81" }}>/hs3</RN.Text> to select HypeSquad house.
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          - Use <RN.Text style={{ color: "#ff6b81" }}>/hsr</RN.Text> to remove your HypeSquad house.
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          - Here you can set a value from <RN.Text style={{ color: "#00ff7f" }}>0</RN.Text> to <RN.Text style={{ color: "#00ff7f" }}>3</RN.Text>:
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 2 }}>
          <RN.Text style={{ color: "#ff6b81" }}>0</RN.Text> = Remove HypeSquad
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 2 }}>
          <RN.Text style={{ color: "#ff6b81" }}>1</RN.Text> = **Bravery House**
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 2 }}>
          <RN.Text style={{ color: "#ff6b81" }}>2</RN.Text> = **Brilliance House**
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 2 }}>
          <RN.Text style={{ color: "#ff6b81" }}>3</RN.Text> = **Balance House**
        </RN.Text>
      </RN.View>
    </RN.ScrollView>
  );
}


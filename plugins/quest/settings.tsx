import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

export default function Settings() {
  const logs = storage.logs || [];

  return (
    <RN.ScrollView style={{ flex: 1, backgroundColor: "#2f3136", padding: 16 }}>
      <RN.Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
        Quest Auto Solver
      </RN.Text>

      <RN.TouchableOpacity
        onPress={() => storage.logs = []}
        style={{
          backgroundColor: "#5865f2",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16
        }}
      >
        <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>
          Clear Logs
        </RN.Text>
      </RN.TouchableOpacity>

      {logs.length === 0 && (
        <RN.Text style={{ color: "#b9bbbe" }}>
          No logs
        </RN.Text>
      )}

      {logs.map((l: string, i: number) => (
        <RN.Text key={i} style={{ color: "#fff", marginBottom: 4 }}>
          {l}
        </RN.Text>
      ))}
    </RN.ScrollView>
  );
}


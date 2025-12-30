
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
  useProxy(storage);

  return (
    <RN.ScrollView style={{ flex: 1, backgroundColor: "#2f3136" }}>
      <RN.View style={{ padding: 16 }}>
        <RN.Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Quest Terminal
        </RN.Text>
        <RN.View style={{ backgroundColor: "#000", borderRadius: 4, padding: 10, minHeight: 450, borderWidth: 1, borderColor: "#444" }}>
          {storage.logs && storage.logs.length > 0 ? (
            storage.logs.map((log: any, i: number) => (
              <RN.View key={i} style={{ marginBottom: 2 }}>
                <RN.Text style={{ fontFamily: "monospace", fontSize: 11 }}>
                  <RN.Text style={{ color: "#aaa" }}>[{log.time}] </RN.Text>
                  <RN.Text style={{ color: log.color }}>{log.message}</RN.Text>
                </RN.Text>
              </RN.View>
            ))
          ) : (
            <RN.Text style={{ color: "#444", fontFamily: "monospace" }}>_</RN.Text>
          )}
        </RN.View>
        <RN.TouchableOpacity
          onPress={() => { storage.logs = []; }}
          style={{ marginTop: 16, backgroundColor: "#444", padding: 10, borderRadius: 4, alignItems: "center" }}
        >
          <RN.Text style={{ color: "#fff", fontSize: 12 }}>CLEAR CONSOLE</RN.Text>
        </RN.TouchableOpacity>
      </RN.View>
    </RN.ScrollView>
  );
}

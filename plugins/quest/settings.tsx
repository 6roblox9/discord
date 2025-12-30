import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
    useProxy(storage);
    const logs = storage.logs || [];

    return (
        <RN.View style={{ flex: 1, backgroundColor: "#202225" }}>
            <RN.View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#2f3136" }}>
                <RN.Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Quest Logs</RN.Text>
            </RN.View>
            <RN.ScrollView style={{ flex: 1, padding: 12 }}>
                {logs.length === 0 ? (
                    <RN.Text style={{ color: "#8e9297", textAlign: "center", marginTop: 20 }}>Waiting for tasks...</RN.Text>
                ) : (
                    logs.map((log: any, i: number) => (
                        <RN.View key={i} style={{ marginBottom: 6, flexDirection: "row" }}>
                            <RN.Text style={{ color: "#72767d", fontSize: 11, width: 80 }}>[{log.time}]</RN.Text>
                            <RN.Text style={{ color: log.color, fontWeight: "500", flex: 1 }}>{log.message}</RN.Text>
                        </RN.View>
                    ))
                )}
            </RN.ScrollView>
            <RN.TouchableOpacity onPress={() => { storage.logs = []; }} style={{ backgroundColor: "#f04747", margin: 16, padding: 12, borderRadius: 8, alignItems: "center" }}>
                <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>Clear Logs</RN.Text>
            </RN.TouchableOpacity>
        </RN.View>
    );
}


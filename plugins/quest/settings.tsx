import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
    useProxy(storage);
    const logs = storage.logs || [];

    return (
        <RN.SafeAreaView style={{ flex: 1, backgroundColor: "#202225" }}>
            <RN.View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#2f3136" }}>
                <RN.Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                    Quest Autocompleter
                </RN.Text>
            </RN.View>

            <RN.ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
            >
                {logs.length === 0 ? (
                    <RN.Text style={{ color: "#8e9297", textAlign: "center", marginTop: 20 }}>
                        No logs yet...
                    </RN.Text>
                ) : (
                    logs.map((log: any, i: number) => (
                        <RN.View key={i} style={{ marginBottom: 6, flexDirection: "row" }}>
                            <RN.Text style={{ color: "#72767d", fontSize: 11, width: 80 }}>
                                [{log.time}]
                            </RN.Text>
                            <RN.Text style={{ color: log.color, fontWeight: "500", flex: 1 }}>
                                {log.message}
                            </RN.Text>
                        </RN.View>
                    ))
                )}
            </RN.ScrollView>

            <RN.View style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                backgroundColor: "#202225",
                padding: 16
            }}>
                <RN.TouchableOpacity
                    onPress={() => { storage.logs = []; }}
                    style={{
                        backgroundColor: "#f04747",
                        padding: 14,
                        borderRadius: 8,
                        alignItems: "center",
                        elevation: 5
                    }}
                >
                    <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>Clear Logs</RN.Text>
                </RN.TouchableOpacity>
            </RN.View>
        </RN.SafeAreaView>
    );
}


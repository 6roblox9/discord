import { React, ReactNative as RN } from "@vendetta/metro/common";
import { logs, subscribe, LogEntry } from "./logger";

export default function Settings() {
    const [_, forceUpdate] = React.useReducer((x) => x + 1, 0);

    React.useEffect(() => {
        const unsub = subscribe(() => forceUpdate());
        return unsub;
    }, []);

    const getColor = (code: LogEntry["color"]) => {
        switch (code) {
            case "G": return "#43b581";
            case "Y": return "#faa61a";
            case "C": return "#00b0f4";
            default: return "#dcddde";
        }
    };

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: "#202225", padding: 12 }}>
            <RN.View style={{ marginBottom: 16 }}>
                <RN.Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                    Quest Auto-Solver Logs
                </RN.Text>
            </RN.View>

            <RN.View style={{ backgroundColor: "#2f3136", borderRadius: 8, padding: 12, minHeight: 200 }}>
                {logs.length === 0 ? (
                    <RN.Text style={{ color: "#72767d", fontStyle: "italic", textAlign: "center", marginTop: 20 }}>
                        Waiting for activity...
                    </RN.Text>
                ) : (
                    logs.map((entry) => (
                        <RN.Text key={entry.id} style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 2 }}>
                            <RN.Text style={{ color: "#72767d" }}>[{entry.time}] </RN.Text>
                            <RN.Text style={{ color: getColor(entry.color) }}>
                                {entry.text}
                            </RN.Text>
                        </RN.Text>
                    ))
                )}
            </RN.View>
            <RN.View style={{ height: 20 }} /> 
        </RN.ScrollView>
    );
}


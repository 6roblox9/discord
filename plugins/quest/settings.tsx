import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

export default function Settings() {
  const [logs, setLogs] = React.useState(storage.logs || []);
  const [refreshing, setRefreshing] = React.useState(false);

  const refreshLogs = () => {
    setRefreshing(true);
    setLogs([...storage.logs || []]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const clearLogs = () => {
    storage.logs = [];
    setLogs([]);
    showToast("تم مسح السجلات", getAssetIDByName("ic_message_delete"));
  };

  return (
    <RN.ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: "#2f3136",
        padding: 16 
      }}
      refreshControl={
        <RN.RefreshControl
          refreshing={refreshing}
          onRefresh={refreshLogs}
          tintColor="#7289da"
          colors={["#7289da"]}
        />
      }
    >
      <RN.View style={{ marginBottom: 20 }}>
        <RN.View style={{ 
          flexDirection: "row", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 16 
        }}>
          <RN.Text style={{
            color: "#fff",
            fontSize: 24,
            fontWeight: "bold"
          }}>
            سجلات الكويستات 🎮
          </RN.Text>
          
          <RN.TouchableOpacity
            onPress={clearLogs}
            style={{
              backgroundColor: "#ed4245",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <RN.Text style={{ 
              color: "#fff", 
              fontWeight: "bold",
              marginLeft: 8
            }}>
              مسح السجلات
            </RN.Text>
          </RN.TouchableOpacity>
        </RN.View>

        <RN.Text style={{
          color: "#b9bbbe",
          fontSize: 14,
          marginBottom: 12
        }}>
          {logs.length === 0 ? "لا توجد سجلات" : `عدد السجلات: ${logs.length}`}
        </RN.Text>
      </RN.View>

      {logs.length === 0 ? (
        <RN.View style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 40
        }}>
          <RN.Text style={{
            color: "#72767d",
            fontSize: 16,
            textAlign: "center"
          }}>
            📝 لا توجد سجلات حالياً
          </RN.Text>
        </RN.View>
      ) : (
        <RN.View style={{
          backgroundColor: "#202225",
          borderRadius: 12,
          overflow: "hidden"
        }}>
          {logs.map((log, index) => (
            <RN.View
              key={index}
              style={{
                padding: 12,
                borderBottomWidth: index === logs.length - 1 ? 0 : 1,
                borderBottomColor: "#2f3136",
                backgroundColor: index % 2 === 0 ? "#202225" : "#25272b"
              }}
            >
              <RN.Text style={{
                color: "#dcddde",
                fontSize: 14,
                fontFamily: "monospace",
                lineHeight: 20
              }}>
                {log}
              </RN.Text>
            </RN.View>
          ))}
        </RN.View>
      )}

      <RN.View style={{ 
        backgroundColor: "#202225", 
        borderRadius: 12, 
        padding: 16,
        marginTop: 20 
      }}>
        <RN.Text style={{ 
          color: "#fff", 
          fontSize: 18, 
          fontWeight: "bold",
          marginBottom: 12 
        }}>
          📖 معلومات البلوقن
        </RN.Text>
        
        <RN.View style={{ marginBottom: 8 }}>
          <RN.Text style={{ color: "#00bfff", fontSize: 16, marginBottom: 4 }}>
            🚀 التشغيل التلقائي:
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - يعمل البلوقن تلقائياً عند فتح ديسكورد
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - يتحقق من وجود كويستات ويبدأ بحلها
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - يتوقف بعد إنهاء جميع الكويستات
          </RN.Text>
        </RN.View>

        <RN.View style={{ marginBottom: 8 }}>
          <RN.Text style={{ color: "#00ff7f", fontSize: 16, marginBottom: 4 }}>
            ⚙️ الزر الجانبي:
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - اضغط على 🎮 في شريط الأعلى
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - لتشغيل الكويستات يدوياً
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - أو عرض السجلات
          </RN.Text>
        </RN.View>

        <RN.View>
          <RN.Text style={{ color: "#ff6b81", fontSize: 16, marginBottom: 4 }}>
            ⚠️ ملاحظات:
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - السجلات تمسح تلقائياً عند إعادة التحميل
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - تأكد من اتصالك بالإنترنت
          </RN.Text>
          <RN.Text style={{ color: "#dcddde", fontSize: 14 }}>
            - قد يستغرق حل الكويستات بعض الوقت
          </RN.Text>
        </RN.View>
      </RN.View>

      <RN.TouchableOpacity
        onPress={() => {
          showToast("تم تحديث السجلات", getAssetIDByName("ic_sync"));
          refreshLogs();
        }}
        style={{
          backgroundColor: "#7289da",
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: "center",
          marginTop: 16
        }}
      >
        <RN.Text style={{ 
          color: "#fff", 
          fontWeight: "bold", 
          fontSize: 16 
        }}>
          🔄 تحديث السجلات
        </RN.Text>
      </RN.TouchableOpacity>
    </RN.ScrollView>
  );
}

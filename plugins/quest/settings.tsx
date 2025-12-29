import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const { getToken } = findByProps("getToken");

// دالة بسيطة للتحقق من الكويستات
async function checkQuests() {
  try {
    const token = getToken();
    if (!token) {
      showToast("لا يوجد توكن");
      return;
    }
    
    showToast("جاري التحقق من الكويستات...");
    
    // محاولة بسيطة للاتصال
    const response = await fetch("https://discord.com/api/v10/quests/@me", {
      headers: { Authorization: token }
    });
    
    if (response.ok) {
      const data = await response.json();
      const quests = data.quests || [];
      const active = quests.filter((q: any) => !q.user_status?.completed_at);
      
      showToast(`وجد ${active.length} كويست نشط`);
      
      // هنا يمكن إضافة حل الكويستات
      if (active.length > 0) {
        showToast("جاري حل الكويستات...");
        // إضافة كود حل الكويستات هنا
      }
    } else {
      showToast(`خطأ: ${response.status}`);
    }
    
  } catch (error) {
    showToast("خطأ في الاتصال");
  }
}

export default {
  onLoad() {
    showToast("بلوقن الكويستات جاهز");
    
    // تشغيل بعد 3 ثواني
    setTimeout(checkQuests, 3000);
  },
  
  onUnload() {
    showToast("تم إيقاف البلوقن");
  },
  
  settings: () => {
    const { React } = require("@vendetta/metro/common");
    const { default: Settings } = require("./settings");
    return React.createElement(Settings);
  }
};

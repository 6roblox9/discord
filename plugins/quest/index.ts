import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const { getToken } = findByProps("getToken");

// مسح اللوق عند التحميل
storage.logs = [];

const log = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  
  if (!storage.logs) storage.logs = [];
  storage.logs.unshift(logMessage);
  
  if (storage.logs.length > 50) storage.logs.pop();
  
  console.log(logMessage);
};

async function fetchQuests(token: string) {
  try {
    const response = await fetch("https://discord.com/api/v10/quests/@me", {
      headers: {
        Authorization: token,
        "User-Agent": "Discord-Android/305012;RNA"
      }
    });
    
    if (!response.ok) {
      showToast(`خطأ: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    showToast(`خطأ في الاتصال`);
    return null;
  }
}

async function enrollQuest(token: string, questId: string) {
  try {
    await fetch(`https://discord.com/api/v10/quests/${questId}/enroll`, {
      method: "POST",
      headers: {
        Authorization: token,
        "User-Agent": "Discord-Android/305012;RNA",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ location: 11, is_targeted: false })
    });
  } catch (error) {
    // تجاهل الخطأ
  }
}

async function sendVideoProgress(token: string, questId: string, timestamp: number) {
  try {
    const response = await fetch(`https://discord.com/api/v10/quests/${questId}/video-progress`, {
      method: "POST",
      headers: {
        Authorization: token,
        "User-Agent": "Discord-Android/305012;RNA",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ timestamp })
    });
    
    return response.json();
  } catch (error) {
    return null;
  }
}

async function sendHeartbeat(token: string, questId: string, appId: string, terminal: boolean) {
  try {
    const response = await fetch(`https://discord.com/api/v10/quests/${questId}/heartbeat`, {
      method: "POST",
      headers: {
        Authorization: token,
        "User-Agent": "Discord-Android/305012;RNA",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ application_id: appId, terminal })
    });
    
    return response.json();
  } catch (error) {
    return null;
  }
}

async function processQuest(token: string, quest: any) {
  const questName = quest.config.messages.quest_name;
  const questId = quest.id;
  
  log(`جاري معالجة: ${questName}`);
  showToast(`بدأ الكويست: ${questName}`);
  
  // التسجيل إذا لم يكن مسجل
  if (!quest.user_status?.enrolled_at) {
    await enrollQuest(token, questId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // الحصول على أحدث بيانات الكويست
  const freshData = await fetchQuests(token);
  const freshQuest = freshData?.quests?.find((q: any) => q.id === questId);
  
  if (!freshQuest || freshQuest.user_status?.completed_at) {
    log(`اكتمل: ${questName}`);
    return;
  }
  
  // معالجة المهام
  const tasks = freshQuest.config.task_config.tasks;
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskType = Object.keys(task)[0];
    const target = task[taskType].target;
    const current = freshQuest.user_status?.progress?.[i]?.value || 0;
    
    if (current >= target) continue;
    
    log(`مهمة ${i + 1}: ${taskType} (${current}/${target})`);
    
    if (taskType.includes("WATCH_VIDEO")) {
      let progress = current;
      while (progress < target) {
        const newProgress = Math.min(target, progress + 5);
        await sendVideoProgress(token, questId, newProgress);
        progress = newProgress;
        log(`فيديو: ${progress}/${target}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      // للأنشطة الأخرى (مثل لعب لعبة)
      for (let j = current; j < target; j++) {
        await sendHeartbeat(token, questId, freshQuest.config.application.id, false);
        log(`نشاط: ${j + 1}/${target}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      await sendHeartbeat(token, questId, freshQuest.config.application.id, true);
    }
  }
  
  log(`تم إكمال: ${questName}`);
  showToast(`تم الكويست: ${questName}`);
}

async function autoCompleteQuests() {
  try {
    log("بدء البحث عن الكويستات...");
    
    const token = getToken();
    if (!token) {
      log("لا يوجد توكن");
      showToast("خطأ في التوكن");
      return;
    }
    
    const data = await fetchQuests(token);
    if (!data?.quests) {
      log("لا توجد بيانات كويستات");
      return;
    }
    
    const now = new Date();
    const availableQuests = data.quests.filter((quest: any) => {
      const completed = quest.user_status?.completed_at;
      const expired = new Date(quest.config.expires_at) <= now;
      return !completed && !expired;
    });
    
    if (availableQuests.length === 0) {
      log("لا توجد كويستات متاحة");
      showToast("لا توجد كويستات");
      return;
    }
    
    log(`وجد ${availableQuests.length} كويست`);
    showToast(`وجد ${availableQuests.length} كويست`);
    
    for (const quest of availableQuests) {
      await processQuest(token, quest);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    log("تم إكمال جميع الكويستات");
    showToast("تم إكمال جميع الكويستات!");
    
  } catch (error) {
    log(`خطأ: ${error.message}`);
  }
}

// متغير لتخزين المؤقت
let questTimer: NodeJS.Timeout;

export default {
  onLoad() {
    log("تم تحميل بلوقن الكويستات");
    showToast("بلوقن الكويستات جاهز");
    
    // تشغيل الكويستات بعد 5 ثواني
    questTimer = setTimeout(() => {
      autoCompleteQuests();
    }, 5000);
  },
  
  onUnload() {
    log("إيقاف بلوقن الكويستات");
    
    if (questTimer) {
      clearTimeout(questTimer);
    }
    
    // مسح اللوق عند الإيقاف
    storage.logs = [];
  },
  
  settings: () => {
    const { React } = require("@vendetta/metro/common");
    const { default: Settings } = require("./settings");
    return React.createElement(Settings);
  }
};

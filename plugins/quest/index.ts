import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import Settings from "./settings";

const { getToken } = findByProps("getToken");
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");

// مسح اللوق القديم عند التحميل
if (storage.logs) storage.logs = [];

const log = (message: string, showToast: boolean = false) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  
  if (!storage.logs) storage.logs = [];
  storage.logs.unshift(logMessage);
  
  if (storage.logs.length > 100) storage.logs.pop();
  
  if (showToast) {
    showToast(message, getAssetIDByName("ic_robot_24px"));
  }
  
  console.log(logMessage);
};

const USER_AGENT = "Discord-Android/305012;RNA";

const PROPS = {
  os: "Android",
  browser: "Discord Android",
  release_channel: "stable",
  client_version: "305012",
  os_version: "13",
  os_arch: "arm64-v8a",
  system_locale: "en-US",
  client_build_number: 305012,
  device: "Pixel",
  manufacturer: "Google",
  model: "Pixel 7"
};

const getXSuperProperties = () => {
  return Buffer.from(JSON.stringify(PROPS)).toString("base64");
};

async function retry<T>(fn: () => Promise<T>, retries: number = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(3000);
    }
  }
  throw new Error("Max retries reached");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchQuests(token: string) {
  return retry(() =>
    fetch("https://discord.com/api/v10/quests/@me", {
      headers: {
        Authorization: token,
        "User-Agent": USER_AGENT,
        "x-super-properties": getXSuperProperties(),
        "Content-Type": "application/json"
      }
    }).then(r => r.json())
  );
}

async function enrollQuest(token: string, questId: string) {
  await retry(() =>
    fetch(`https://discord.com/api/v10/quests/${questId}/enroll`, {
      method: "POST",
      headers: {
        Authorization: token,
        "User-Agent": USER_AGENT,
        "x-super-properties": getXSuperProperties(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        location: 11,
        is_targeted: false,
        metadata_raw: null
      })
    })
  );
}

async function sendVideoProgress(token: string, questId: string, timestamp: number) {
  return retry(() =>
    fetch(`https://discord.com/api/v10/quests/${questId}/video-progress`, {
      method: "POST",
      headers: {
        Authorization: token,
        "User-Agent": USER_AGENT,
        "x-super-properties": getXSuperProperties(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ timestamp })
    }).then(r => r.json())
  );
}

async function sendHeartbeat(token: string, questId: string, applicationId: string, terminal: boolean) {
  return retry(() =>
    fetch(`https://discord.com/api/v10/quests/${questId}/heartbeat`, {
      method: "POST",
      headers: {
        Authorization: token,
        "User-Agent": USER_AGENT,
        "x-super-properties": getXSuperProperties(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ application_id: applicationId, terminal })
    }).then(r => r.json())
  );
}

async function runTask(token: string, quest: any, taskIndex: number) {
  const questName = quest.config.messages.quest_name;
  const questId = quest.id;
  const taskConfig = quest.config.task_config.tasks[taskIndex];
  const taskType = Object.keys(taskConfig)[0];
  const target = taskConfig[taskType].target;
  
  let progress = quest.user_status?.progress?.[taskIndex]?.value || 0;
  let lastPrint = 0;
  
  log(`بداية المهمة: ${questName} - ${taskType}`, true);
  
  if (taskType.includes("WATCH_VIDEO")) {
    while (progress < target) {
      const response = await sendVideoProgress(token, questId, Math.min(target, progress + 7 + Math.random() * 3));
      progress += 7;
      
      if (Date.now() - lastPrint >= 10000) {
        log(`${questName}: ${Math.min(progress, target)}/${target} (متبقي: ${Math.max(0, target - progress)})`);
        lastPrint = Date.now();
      }
      
      if (response.completed_at) break;
      await sleep(2000 + Math.random() * 1000);
    }
  } else {
    while (true) {
      const response = await sendHeartbeat(token, questId, quest.config.application.id, false);
      progress = response.progress?.[taskIndex]?.value || progress;
      
      if (Date.now() - lastPrint >= 10000) {
        log(`${questName}: ${progress}/${target} (متبقي: ${Math.max(0, target - progress)})`);
        lastPrint = Date.now();
      }
      
      if (response.completed_at) break;
      await sleep(30000 + Math.random() * 5000);
    }
    
    await sendHeartbeat(token, questId, quest.config.application.id, true);
  }
  
  log(`اكتملت المهمة: ${questName} - ${taskType}`, true);
}

async function processQuest(token: string, quest: any) {
  try {
    const questName = quest.config.messages.quest_name;
    
    if (!quest.user_status?.enrolled_at) {
      log(`التسجيل في الكويست: ${questName}`, true);
      await enrollQuest(token, quest.id);
    }
    
    while (true) {
      const freshQuestData = await fetchQuests(token);
      const freshQuest = (freshQuestData.quests || []).find((q: any) => q.id === quest.id);
      
      if (!freshQuest || freshQuest.user_status?.completed_at) {
        log(`اكتمل الكويست: ${questName}`, true);
        break;
      }
      
      const tasks = Object.keys(freshQuest.config.task_config.tasks);
      const pendingTasks = tasks.filter((_, index) => {
        const taskConfig = freshQuest.config.task_config.tasks[index];
        const taskType = Object.keys(taskConfig)[0];
        const target = taskConfig[taskType].target;
        const done = freshQuest.user_status?.progress?.[index]?.value || 0;
        return done < target;
      });
      
      if (pendingTasks.length === 0) break;
      
      await runTask(token, freshQuest, parseInt(pendingTasks[0]));
      await sleep(3000);
    }
  } catch (error) {
    log(`خطأ في معالجة الكويست: ${error.message}`);
  }
}

async function autoCompleteQuests() {
  try {
    const token = getToken();
    if (!token) {
      log("فشل في الحصول على التوكن", true);
      return;
    }
    
    log("جاري البحث عن الكويستات...", true);
    
    const questsData = await fetchQuests(token);
    const availableQuests = (questsData.quests || []).filter((quest: any) => {
      const isCompleted = quest.user_status?.completed_at;
      const isExpired = new Date(quest.config.expires_at) <= new Date();
      return !isCompleted && !isExpired;
    });
    
    if (availableQuests.length === 0) {
      log("لا توجد كويستات متاحة حالياً", true);
      return;
    }
    
    log(`تم العثور على ${availableQuests.length} كويست`, true);
    
    for (const quest of availableQuests) {
      await processQuest(token, quest);
      await sleep(5000);
    }
    
    log("تم إكمال جميع الكويستات بنجاح!", true);
  } catch (error) {
    log(`خطأ: ${error.message}`, true);
  }
}

let unpatch: () => void;

export default {
  onLoad() {
    log("تم تحميل البلوقن بنجاح", true);
    
    // تشغيل الكويستات تلقائياً عند التحميل
    setTimeout(() => {
      autoCompleteQuests();
    }, 10000); // تأخير 10 ثواني لضمان تحميل التطبيق بالكامل
    
    // إضافة زر في شريط الإعدادات
    unpatch = before("showUserProfile", (args) => {
      const [props] = args;
      if (props?.userId) return;
      
      setTimeout(() => {
        const headerButtons = document.querySelectorAll('[class*="headerBar"] button');
        if (headerButtons.length > 0) {
          const lastButton = headerButtons[headerButtons.length - 1];
          const questButton = document.createElement("button");
          questButton.innerHTML = "🎮";
          questButton.style.cssText = `
            background: transparent;
            border: none;
            color: white;
            font-size: 20px;
            padding: 8px;
            cursor: pointer;
            margin-right: 8px;
          `;
          questButton.onclick = () => {
            showSimpleActionSheet({
              key: "QuestActions",
              header: {
                title: "إدارة الكويستات",
                onClose: () => {}
              },
              options: [
                {
                  label: "تشغيل الكويستات الآن",
                  onPress: () => autoCompleteQuests()
                },
                {
                  label: "عرض السجلات",
                  onPress: () => {
                    const logsWindow = window.open("", "_blank");
                    if (logsWindow) {
                      logsWindow.document.write(`
                        <html>
                          <head>
                            <title>سجلات الكويستات</title>
                            <style>
                              body {
                                background: #36393f;
                                color: white;
                                font-family: sans-serif;
                                padding: 20px;
                              }
                              .log {
                                padding: 8px;
                                border-bottom: 1px solid #444;
                                word-break: break-word;
                              }
                            </style>
                          </head>
                          <body>
                            <h1>سجلات الكويستات</h1>
                            <div id="logs"></div>
                            <script>
                              const logs = ${JSON.stringify(storage.logs || [])};
                              const container = document.getElementById('logs');
                              logs.forEach(log => {
                                const div = document.createElement('div');
                                div.className = 'log';
                                div.textContent = log;
                                container.appendChild(div);
                              });
                            </script>
                          </body>
                        </html>
                      `);
                    }
                  }
                },
                {
                  label: "مسح السجلات",
                  onPress: () => {
                    storage.logs = [];
                    showToast("تم مسح السجلات");
                  }
                }
              ]
            });
          };
          
          if (!document.querySelector(".quest-button")) {
            questButton.className = "quest-button";
            lastButton.parentNode?.insertBefore(questButton, lastButton);
          }
        }
      }, 1000);
    });
  },
  
  onUnload() {
    log("تم إيقاف البلوقن", true);
    if (unpatch) unpatch();
    storage.logs = [];
  },
  
  settings: Settings
};

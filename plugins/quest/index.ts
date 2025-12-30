import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./settings";

const getToken = findByProps("getToken").getToken;

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36';

const PROPS = {
  os: 'Windows',
  browser: 'Discord Client',
  release_channel: 'stable',
  client_version: '1.0.9215',
  os_version: '10.0.19045',
  os_arch: 'x64',
  app_arch: 'x64',
  system_locale: 'en-US',
  has_client_mods: false,
  client_launch_id: randomUUID(),
  browser_user_agent: USER_AGENT,
  browser_version: '37.6.0',
  os_sdk_version: '19045',
  client_build_number: 471091,
  native_build_number: 72186,
  client_event_source: null,
  launch_signature: randomUUID(),
  client_heartbeat_session_id: randomUUID(),
  client_app_state: 'focused'
};

const SUPER_PROPS = btoa(JSON.stringify(PROPS));

function log(color: string, message: string) {
  const time = new Date().toLocaleTimeString();
  storage.logs = [...(storage.logs || []), { time, message, color }].slice(-100);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function retry(fn: any, n = 5) {
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch { await sleep(3000); }
  }
}

async function request(url: string, method = "GET", body?: any) {
  const token = getToken();
  return await retry(() => fetch(url, {
    method,
    headers: {
      "Authorization": token,
      "User-Agent": USER_AGENT,
      "x-super-properties": SUPER_PROPS,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  }).then(r => r.json()));
}

async function runTask(q: any, task: string) {
  const questName = q.config.messages.quest_name;
  const id = q.id;
  const need = q.config.task_config.tasks[task].target;
  let done = q.user_status?.progress?.[task]?.value || 0;

  log('#ffff00', `${questName} type: ${task}`);

  if (task.includes('WATCH_VIDEO')) {
    while (done < need) {
      const r = await request(`https://discord.com/api/v10/quests/${id}/video-progress`, 'POST', {
        timestamp: Math.min(need, done + 7 + Math.random())
      });
      done += 7;
      log('#00ffff', `${questName} ${Math.min(done, need)}/${need} remaining ${Math.max(0, need - done)}`);
      if (r.completed_at) break;
      await sleep(2000);
    }
  } else {
    while (true) {
      const r = await request(`https://discord.com/api/v10/quests/${id}/heartbeat`, 'POST', {
        application_id: q.config.application.id,
        terminal: false
      });
      done = r.progress?.[task]?.value || done;
      log('#00ffff', `${questName} ${done}/${need} remaining ${Math.max(0, need - done)}`);
      if (r.completed_at) break;
      await sleep(30000);
    }
    await request(`https://discord.com/api/v10/quests/${id}/heartbeat`, 'POST', {
      application_id: q.config.application.id,
      terminal: true
    });
  }
  log('#00ff00', `${questName} ${task} completed`);
}

async function processQuest(initialQuest: any) {
  let q = initialQuest;
  if (!q.user_status?.enrolled_at) {
    await request(`https://discord.com/api/v10/quests/${q.id}/enroll`, 'POST', { location: 11, is_targeted: false, metadata_raw: null });
  }

  while (true) {
    const data = await request('https://discord.com/api/v10/quests/@me');
    q = (data.quests || []).find((x: any) => x.id === q.id);
    if (!q || q.user_status?.completed_at) break;

    const tasks = Object.keys(q.config.task_config.tasks);
    const pending = tasks.filter(t => {
      const need = q.config.task_config.tasks[t].target;
      const done = q.user_status?.progress?.[t]?.value || 0;
      return done < need;
    });

    if (!pending.length) break;
    await runTask(q, pending[0]);
    await sleep(3000);
  }
  log('#00ff00', `${q.config.messages.quest_name} fully completed`);
}

async function startAutomator() {
  try {
    const user = await request('https://discord.com/api/v10/users/@me');
    log('#00ff00', `Logged ${user.username}`);

    const data = await request('https://discord.com/api/v10/quests/@me');
    const quests = (data.quests || []).filter((q: any) =>
      !q.user_status?.completed_at && new Date(q.config.expires_at) > new Date()
    );

    log('#ffff00', `Quests ${quests.length}`);
    for (const q of quests) await processQuest(q);
    log('#00ff00', 'All quests finished');
  } catch (e) {
    log('#ff0000', `Error: ${e.message}`);
  }
}

export default {
  onLoad() {
    storage.logs = [];
    startAutomator();
  },
  onUnload() {},
  settings: Settings
};


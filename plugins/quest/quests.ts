import { storage } from "@vendetta/plugin";

const UA = "Discord-Android/305012;RNA";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function api(url: string, token: string, method = "GET", body?: any) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: token,
      "User-Agent": UA,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function quests(token: string) {
  const d = await api("https://discord.com/api/v10/quests/@me", token);
  return (d.quests || []).filter((q: any) =>
    !q.user_status?.completed_at &&
    new Date(q.config.expires_at) > new Date()
  );
}

async function enroll(token: string, id: string) {
  await api(`https://discord.com/api/v10/quests/${id}/enroll`, token, "POST", {
    location: 11,
    is_targeted: false,
    metadata_raw: null
  });
}

async function video(token: string, id: string, ts: number) {
  await api(`https://discord.com/api/v10/quests/${id}/video-progress`, token, "POST", {
    timestamp: ts
  });
}

async function hb(token: string, id: string, app: string, terminal: boolean) {
  return api(`https://discord.com/api/v10/quests/${id}/heartbeat`, token, "POST", {
    application_id: app,
    terminal
  });
}

async function solve(token: string, q: any) {
  storage.logs.push(`Quest: ${q.config.messages.quest_name}`);

  if (!q.user_status?.enrolled_at) {
    await enroll(token, q.id);
    storage.logs.push("Enrolled");
  }

  while (true) {
    const fresh = (await quests(token)).find((x: any) => x.id === q.id);
    if (!fresh || fresh.user_status?.completed_at) break;

    const tasks = Object.keys(fresh.config.task_config.tasks);
    const task = tasks.find(t => {
      const need = fresh.config.task_config.tasks[t].target;
      const done = fresh.user_status?.progress?.[t]?.value || 0;
      return done < need;
    });

    if (!task) break;

    const need = fresh.config.task_config.tasks[task].target;
    let done = fresh.user_status?.progress?.[task]?.value || 0;

    storage.logs.push(`Task: ${task}`);

    if (task.includes("WATCH_VIDEO")) {
      while (done < need) {
        await video(token, fresh.id, Math.min(need, done + 6));
        done += 6;
        await sleep(2000 + Math.random() * 2000);
      }
    } else {
      while (true) {
        const r = await hb(token, fresh.id, fresh.config.application.id, false);
        done = r.progress?.[task]?.value || done;
        if (r.completed_at) break;
        await sleep(25000 + Math.random() * 10000);
      }
      await hb(token, fresh.id, fresh.config.application.id, true);
    }
  }

  storage.logs.push("Quest completed");
}

export async function runQuests(token: string) {
  const list = await quests(token);
  storage.logs.push(`Found ${list.length} quests`);

  if (!list.length) return false;

  for (const q of list) {
    await solve(token, q);
    await sleep(3000);
  }

  return true;
}


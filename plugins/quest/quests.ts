import { storage } from "@vendetta/plugin";

const USER_AGENT = "Discord-Android/305012;RNA";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function req(url: string, token: string, method = "GET", body?: any) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: token,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function getQuests(token: string) {
  const data = await req("https://discord.com/api/v10/quests/@me", token);
  return (data.quests || []).filter((q: any) =>
    !q.user_status?.completed_at &&
    new Date(q.config.expires_at) > new Date()
  );
}

async function enroll(token: string, id: string) {
  await req(`https://discord.com/api/v10/quests/${id}/enroll`, token, "POST", {
    location: 11,
    is_targeted: false,
    metadata_raw: null
  });
}

async function video(token: string, id: string, ts: number) {
  return req(`https://discord.com/api/v10/quests/${id}/video-progress`, token, "POST", {
    timestamp: ts
  });
}

async function heartbeat(token: string, id: string, app: string, terminal: boolean) {
  return req(`https://discord.com/api/v10/quests/${id}/heartbeat`, token, "POST", {
    application_id: app,
    terminal
  });
}

async function processQuest(token: string, q: any) {
  if (!q.user_status?.enrolled_at) await enroll(token, q.id);

  while (true) {
    const fresh = (await getQuests(token)).find((x: any) => x.id === q.id);
    if (!fresh || fresh.user_status?.completed_at) break;

    const tasks = Object.keys(fresh.config.task_config.tasks);
    const pending = tasks.filter(t => {
      const need = fresh.config.task_config.tasks[t].target;
      const done = fresh.user_status?.progress?.[t]?.value || 0;
      return done < need;
    });

    if (!pending.length) break;

    const task = pending[0];
    const need = fresh.config.task_config.tasks[task].target;
    let done = fresh.user_status?.progress?.[task]?.value || 0;

    if (task.includes("WATCH_VIDEO")) {
      while (done < need) {
        await video(token, fresh.id, Math.min(need, done + 6 + Math.random() * 4));
        done += 6;
        await sleep(2000 + Math.random() * 2000);
      }
    } else {
      while (true) {
        const r = await heartbeat(token, fresh.id, fresh.config.application.id, false);
        done = r.progress?.[task]?.value || done;
        if (r.completed_at) break;
        await sleep(25000 + Math.random() * 10000);
      }
      await heartbeat(token, fresh.id, fresh.config.application.id, true);
    }
  }
}

export async function runQuests(token: string) {
  storage.logs = [];
  const quests = await getQuests(token);
  if (!quests.length) return false;

  for (const q of quests) {
    await processQuest(token, q);
    await sleep(3000);
  }
  return true;
}

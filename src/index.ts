import { startSession, putRecord } from "./atproto"
import { fetchAndExtract, type Record } from "./stac-extract"

// The maximum number of metadata records we request from the STAC catalogue.
const MAX_REQUESTED = 100
// The maximum number of recrods we post on ATProto within one invocation of
// the worker.
const MAX_POSTED = 45

/// Publish the records on ATProto.
const publishRecords = async (env: Env, records: Record[]) => {
  const session = await startSession(env)
  for (const record of records) {
    // Doing it with an await here, so that there aren't too many simultaneous
    // requests.
    await putRecord(session, record)
  }
}

const doit = async (env: Env) => {
  const extracted = await fetchAndExtract(MAX_REQUESTED)

  const { results } = await env.STATE.prepare(
    "SELECT value FROM kv_store WHERE key = ?",
  )
    .bind("last-created")
    .all()
  const lastCreated = results[0]?.value || "2000-01-01T00:00:00Z"

  console.log(`Last created date is: ${lastCreated}`)

  // Only keep entries that are newer than last time. The last entry is one
  // that was already inserted. It's kept in order to check that there are no
  // gaps between runs.
  const filtered = extracted.filter((item) => {
    return item.created >= lastCreated
  })

  console.log(`Filtered new entries (${filtered.length}):`, filtered)

  // Check if there is no gap to previous request.
  // The filter also checks for equality, this means that there's always at
  // least one item in the list.
  const oldest = filtered.pop()!
  if (oldest.created != lastCreated) {
    console.warn(
      `There might be a gap between ${lastCreated} and ${oldest.created}`,
    )
    // Persist information about gaps in the KV store.
    await env.STATE.prepare(
      "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
    )
      .bind(`gap:${lastCreated}`, oldest.created)
      .run()
    // As the oldest item didn't match the previous run, put it back into the
    // list of new entries.
    filtered.push(oldest)
  }

  if (filtered.length > 0) {
    // On the free tier it's only allowed to make at most 50 (sub-)requests
    // per worker invocation. Hence limit it to 45 puts to be on the safe
    // side. On the next run, we will re-request the ones we've potentially
    // removed.
    const reduced = filtered.slice(-45)

    const newestCreated = reduced[0].created

    await publishRecords(env, reduced)

    await env.STATE.prepare(
      "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
    )
      .bind("last-created", newestCreated)
      .run()
    console.log(`Newest created date is: ${newestCreated}`)

    return reduced.length
  } else {
    return 0
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === "/doit") {
      const numNewEntries = await doit(env)
      return Response.json({ numNewEntries }, { status: 200 })
    }
    return new Response("Worker is alive. Try GET /doit", { status: 200 })
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    //console.log(`Cron triggered at ${new Date().toISOString()}`);
    const numNewEntries = await doit(env)
    console.log(`Cron added ${numNewEntries} new entries`)
  },
}

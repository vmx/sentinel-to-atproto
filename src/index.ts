import { startSession, putRecords } from "./atproto"
import { fetchAndExtract, type Record } from "./stac-extract"

// The maximum number of items that can be written within a single
// `applyWrites` call on a Bluesky PDS.
const BLUESKY_MAX_BATCH_SIZE = 200

/// Publish the records on ATProto.
const publishRecords = async (env: Env, records: Record[]) => {
  const session = await startSession(env)

  // There is a maximum number of records that can be put within a single
  // request, hence chunk the input if needed.
  for (let ii = 0; ii < records.length; ii += BLUESKY_MAX_BATCH_SIZE) {
    const chunk = records.slice(ii, ii + BLUESKY_MAX_BATCH_SIZE)
    await putRecords(session, chunk)
  }
}

const doit = async (env: Env) => {
  const extracted = await fetchAndExtract()

  const lastCreated =
    (await env.STATE.get("last-created")) || "2000-01-01T00:00:00Z"
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
    await env.STATE.put(`gap:${lastCreated}`, oldest.created)
    // As the oldest item didn't match the previous run, put it back into the
    // list of new entries.
    filtered.push(oldest)
  }

  if (filtered.length > 0) {
    const newestCreated = filtered[0].created

    await publishRecords(env, filtered)

    await env.STATE.put("last-created", newestCreated)
    console.log(`Newest created date is: ${newestCreated}`)
  }

  return filtered.length
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

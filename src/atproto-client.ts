// Minimal implementation of and ATProto client that can create records.

export interface AtpSession {
  accessJwt: string
  refreshJwt: string
  handle: string
  did: string
}

export interface AtpPutRecord {
  jwt: string
  repo: string
  collection: string
  rkey: string
  record: unknown
}

export interface AtpPutRecordResp {
  uri: string
  cid: string
}

const PDS = "https://bsky.social"

export async function atpCreateSession(
  identifier: string,
  password: string,
): Promise<AtpSession> {
  const url = new URL("/xrpc/com.atproto.server.createSession", PDS)
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier,
      password,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => "(unknown error)")
    throw new Error(`Authentication failed: ${resp.status} ${err}`)
  }

  return resp.json()
}

export async function atpPutRecord({
  jwt,
  repo,
  collection,
  record,
  rkey,
}: AtpPutRecord): Promise<AtpPutRecordResp> {
  const url = new URL("/xrpc/com.atproto.repo.putRecord", PDS)
  const body = {
    repo,
    collection,
    rkey,
    record,
    validate: false,
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => "(unknown error)")
    throw new Error(`putRecord failed: ${resp.status} ${err}`)
  }

  return resp.json()
}

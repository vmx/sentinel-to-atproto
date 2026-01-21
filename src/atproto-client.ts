// Minimal implementation of and ATProto client that can create records.

export interface AtpSession {
  accessJwt: string
  refreshJwt: string
  handle: string
  did: string
}

export interface AtpApplyWritesCreate {
  jwt: string
  repo: string
  writes: {
    $type: "com.atproto.repo.applywrites#create"
    //$type: string,
    collection: string
    rkey: string
    value: unknown
  }[]
}

// TODO vmx 2026-01-21: add proper definition.
export interface AtpApplyWritesCreateResp {}

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

export async function atpApplyWritesCreate({
  jwt,
  repo,
  writes,
}: AtpApplyWritesCreate): Promise<AtpApplyWritesCreateResp> {
  const url = new URL("/xrpc/com.atproto.repo.applyWrites", PDS)
  const body = {
    repo,
    writes,
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

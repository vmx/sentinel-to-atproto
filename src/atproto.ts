import * as TID from "@atcute/tid"

import {
  atpCreateSession,
  atpApplyWritesCreate,
  type AtpSession,
} from "./atproto-client"
import type { Record } from "./stac-extract"

export const startSession = async (env: Env): Promise<AtpSession> => {
  return atpCreateSession(env.BLUESKY_USERNAME, env.BLUESKY_PASSWORD)
}

export const putRecords = async (session: AtpSession, records: Record[]) => {
  const writes = records.map((record) => {
    const { preview, publishedAt, resource } = record
    return {
      $type: "com.atproto.repo.applyWrites#create" as const,
      collection: "cx.vmx.matadisco",
      rkey: TID.now(),
      value: {
        resource,
        preview: {
          url: preview,
          mimeType: "image/jpeg",
        },
        publishedAt,
      },
    }
  })

  return atpApplyWritesCreate({
    jwt: session.accessJwt,
    repo: session.did,
    writes,
  })
}

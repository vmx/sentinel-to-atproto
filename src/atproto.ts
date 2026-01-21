import * as TID from "@atcute/tid"

import {
  atpCreateSession,
  atpApplyWritesCreate,
  type AtpSession,
} from "./atproto-client"
import type { Record } from "./stac-extract"

export const startSession = async (env: Env): Promise<AtpSession> => {
  return atpCreateSession(env.BLUEKSY_USERNAME, env.BLUEKSY_PASSWORD)
}

export const putRecords = async (session: AtpSession, records: Record[]) => {
  const writes = records.map((record) => {
    const { metadata, preview, created } = record
    return {
      $type: 'com.atproto.repo.applyWrites#create' as const,
      collection: "cx.vmx.dev.tmp001.matadata",
      rkey: TID.now(),
      value: {
        metadata,
        preview: {
          url: preview,
          mimeType: "image/jpeg",
        },
        created,
      },
    }
  })

  return atpApplyWritesCreate({
    jwt: session.accessJwt,
    repo: session.did,
    writes,
  })
}

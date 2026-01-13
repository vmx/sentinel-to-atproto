import * as TID from "@atcute/tid"

import {
  atpCreateSession,
  atpPutRecord,
  type AtpSession,
} from "./atproto-client"
import type { Record } from "./stac-extract"

export const startSession = async (env: Env): Promise<AtpSession> => {
  return atpCreateSession(env.BLUEKSY_USERNAME, env.BLUEKSY_PASSWORD)
}

export const putRecord = async (session: AtpSession, record: Record) => {
  const { metadata, preview, created } = record
  return atpPutRecord({
    jwt: session.accessJwt,
    repo: session.did,
    collection: "cx.vmx.dev.tmp001.matadata",
    rkey: TID.now(),
    record: {
      metadata,
      preview: {
        url: preview,
        mimeType: "image/jpeg",
      },
      created,
    },
  })
}

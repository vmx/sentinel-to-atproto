import * as TID from "@atcute/tid"

import {
  atpCreateSession,
  atpApplyWritesCreate,
  type AtpSession,
} from "./atproto-client"
import type { Eo, Record, Stac } from "./stac-extract"

// A `cx.vmx.matadisco` record. `stac` and `eo` are the top-level keys that
// correspond to the tags of the same name.
interface Matadisco {
  resource: string
  preview: {
    url: string
    mimeType: string
  }
  publishedAt: string
  tags: string[]
  stac: Stac
  eo?: Eo
}

export const startSession = async (env: Env): Promise<AtpSession> => {
  return atpCreateSession(env.BLUESKY_USERNAME, env.BLUESKY_PASSWORD)
}

export const putRecords = async (session: AtpSession, records: Record[]) => {
  const writes = records.map((record) => {
    const { preview, publishedAt, resource, stac, eo } = record

    const value: Matadisco = {
      resource,
      preview: {
        url: preview,
        mimeType: "image/jpeg",
      },
      publishedAt,
      tags: ["stac"],
      stac,
    }

    if (eo !== undefined) {
      value.tags.push("eo")
      value.eo = eo
    }

    return {
      $type: "com.atproto.repo.applyWrites#create" as const,
      collection: "cx.vmx.matadisco",
      rkey: TID.now(),
      value,
    }
  })

  return atpApplyWritesCreate({
    jwt: session.accessJwt,
    repo: session.did,
    writes,
  })
}

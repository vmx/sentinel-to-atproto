interface Link {
  rel: string
  href: string
  [key: string]: unknown // allow extra STAC link fields
}

interface Geometry {
  type: string
  coordinates: unknown
}

interface Feature {
  id: string
  collection: string
  bbox: number[]
  geometry: Geometry
  properties: {
    created: string // ISO 8601 timestamp (e.g., '2025-12-10T14:23:00Z')
    datetime: string // when the data was acquired, not when it was published
    platform: string
    "eo:cloud_cover"?: number
    [key: string]: unknown
  }
  links: Link[]
  // assets omitted per exclude list
}

interface STACSearchResponse {
  features: Feature[]
  // other optional STAC Catalog fields like "type", "context", etc.
  [key: string]: unknown
}

// The ATProto data model has no floating point numbers, hence any value
// containing them is stored as a JSON string. Consumers get the original
// values back by running it through `JSON.parse()`.
type JSONString = string

// Core STAC Item fields worth having direct access to, without resolving the
// `resource` URI first. Corresponds to the `stac` tag.
export interface Stac {
  id: string
  collection: string
  datetime: string
  bbox: JSONString
  geometry: JSONString
  platform: string
}

// Fields of the STAC Electro-Optical extension. Corresponds to the `eo` tag.
export interface Eo {
  cloudCover: JSONString
}

export interface Record {
  preview: string
  publishedAt: string
  resource: string
  stac: Stac
  eo?: Eo
}

export const fetchAndExtract = async (): Promise<Record[]> => {
  const url = "https://earth-search.aws.element84.com/v1/search"

  const requestBody = {
    collections: ["sentinel-2-l2a"],
    limit: 250,
    sortby: [
      {
        field: "properties.created",
        direction: "desc",
      },
    ],
    fields: {
      include: [
        "id",
        "collection",
        "bbox",
        "geometry",
        "properties.created",
        "properties.datetime",
        "properties.platform",
        "properties.eo:cloud_cover",
        "links",
      ],
      exclude: ["assets"],
    },
    //} satisfies RequestInit['body'] & Record<string, unknown>; // type assertion helper
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "VmxWorker/0.1 (contact: volker.mische@gmail.com)",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: STACSearchResponse = await response.json()

    const extracted: Record[] = data.features.map((feature) => {
      const resource = feature.links.find((l) => l.rel === "self")!.href.trim()
      const preview = feature.links
        .find((l) => l.rel === "thumbnail")!
        .href.trim()
      const publishedAt = feature.properties.created

      const stac: Stac = {
        id: feature.id,
        collection: feature.collection,
        datetime: feature.properties.datetime,
        bbox: JSON.stringify(feature.bbox),
        geometry: JSON.stringify(feature.geometry),
        platform: feature.properties.platform,
      }

      const record: Record = { publishedAt, preview, resource, stac }

      const cloudCover = feature.properties["eo:cloud_cover"]
      if (cloudCover !== undefined) {
        record.eo = { cloudCover: JSON.stringify(cloudCover) }
      }

      return record
    })

    return extracted
  } catch (error) {
    console.error("Error fetching STAC", error)
    return [] // or throw error if preferred
  }
}

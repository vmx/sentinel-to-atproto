interface Link {
  rel: string
  href: string
  [key: string]: unknown // allow extra STAC link fields
}

interface Feature {
  id: string
  properties: {
    created: string // ISO 8601 timestamp (e.g., '2025-12-10T14:23:00Z')
    [key: string]: unknown
  }
  links: Link[]
  // geometry, bbox, assets omitted per exclude list
}

interface STACSearchResponse {
  features: Feature[]
  // other optional STAC Catalog fields like "type", "context", etc.
  [key: string]: unknown
}

export interface Record {
  metadata: string
  preview: string
  created: string
}

export const fetchAndExtract = async (): Promise<Record[]> => {
  const url = "https://earth-search.aws.element84.com/v1/search"

  const requestBody = {
    collections: ["sentinel-2-l2a"],
    limit: 200,
    sortby: [
      {
        field: "properties.created",
        direction: "desc",
      },
    ],
    fields: {
      include: ["id", "properties.created", "links"],
      exclude: ["geometry", "bbox", "assets"],
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
      const metadata = feature.links.find((l) => l.rel === "self")!.href.trim()
      const preview = feature.links
        .find((l) => l.rel === "thumbnail")!
        .href.trim()
      const created = feature.properties.created

      return { metadata, preview, created }
    })

    return extracted
  } catch (error) {
    console.error("Error fetching STAC", error)
    return [] // or throw error if preferred
  }
}

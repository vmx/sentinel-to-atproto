Sentinel to ATproto
===================

This is a [Cloudflare worker] that scrapes a [STAC catalogue] containing the [Copernicus Sentinel-2 L2A data]. It then publishes [Matadisco] records on [ATProto].

This repo also serves as a template that can easily modified to publish your own Matadisco records via a Cloudflare worker.


Published records
-----------------

The Matadisco Lexicon notes that a tag might have a corresponding top-level key with the same name. The published records make use of that to carry the parts of the STAC Item that are useful to have direct access to, without resolving the `resource` URI first. It is deliberately not the full STAC Item:

 - `stac`: core STAC Item fields. `datetime` is when the data was acquired, whereas the record's `publishedAt` is when the metadata was published.
 - `eo`: fields of the [STAC Electro-Optical extension]. Only present if the item reports a cloud cover.

The ATProto data model has no floating point numbers, hence values containing them are stored as JSON strings. Running those through `JSON.parse()` returns the original values.

```json
{
  "resource": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2C_44XMP_20260722_3_L2A",
  "publishedAt": "2026-07-22T14:56:23.189Z",
  "preview": {
    "url": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/S2C_44XMP_20260722_3_L2A/thumbnail",
    "mimeType": "image/jpeg"
  },
  "tags": ["stac", "eo"],
  "stac": {
    "id": "S2C_44XMP_20260722_3_L2A",
    "collection": "sentinel-2-l2a",
    "datetime": "2026-07-22T10:26:39.741000Z",
    "bbox": "[75.768073,79.819129,81.506529,80.164951]",
    "geometry": "{\"coordinates\":[[[75.7680726931639,80.12498280943359],[75.92404941926179,79.81912948641171],[81.49018910880739,80.02391497749997],[81.50652900450825,80.1649507581478],[75.7680726931639,80.12498280943359]]],\"type\":\"Polygon\"}",
    "platform": "sentinel-2c"
  },
  "eo": {
    "cloudCover": "95.463574"
  }
}
```


Initial setup
-------------

    npx wrangler kv namespace create STATE


### Environment variables

You can put the environment variables into a [`.env` file].

    CLOUDFLARE_ACCOUNT_ID=8a53d9807182ed15692b1a3f4c12af96
    CLOUDFLARE_API_TOKEN="mFmOTYwZjBjMTQ2OGUxY_TQ0YTk2NWYxYzljYTVj"
    BLUESKY_USERNAME=atproto-account@example.org
    BLUESKY_PASSWORD=Averysecurepassword


Development
-----------

To run the worker locally:

    npm run dev

You can then trigger it via

    curl -X GET http://localhost:8787/doit

When changing the `wrangler.jsonc` configuration, re-run the types generator:

    npm run cf-typegen


Deployment
----------

Deploy it to Cloudflare:

     npm run deploy


License
-------

This project is licensed under either of

 - Apache License, Version 2.0, ([LICENSE-APACHE] or https://www.apache.org/licenses/LICENSE-2.0)
 - MIT license ([LICENSE-MIT] or https://opensource.org/licenses/MIT)

at your option.


[Cloudflare Worker]: https://developers.cloudflare.com/workers/
[STAC catalogue]: https://stacspec.org/
[Copernicus Sentinel-2 L2A data]: https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-2-msi/product-types/level-2a
[ATProto]: https://atproto.com/
[Matadisco]: https://matadisco.org/
[STAC Electro-Optical extension]: https://github.com/stac-extensions/eo
[`.env` file]: https://www.dotenv.org/docs/security/env
[LICENSE-APACHE]: ./LICENSE-APACHE
[LICENSE-MIT]: ./LICENSE-MIT

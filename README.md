Sentinel to ATproto
===================

This is a [Cloudflare worker] that scrapes a [STAC catalogue] containing the [Copernicus Sentinel-2 L2A data]. It then publishes metadata records on [ATProto].

Initial setup
-------------

    npx wrangler d1 create state
    npx wrangler d1 execute state --command="CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT);"
    npx wrangler d1 execute state --remote --command="CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT);"


### Environment variables

You can put the environment variables into a [`.env` file].

    CLOUDFLARE_ACCOUNT_ID=8a53d9807182ed15692b1a3f4c12af96
    CLOUDFLARE_API_TOKEN="mFmOTYwZjBjMTQ2OGUxY_TQ0YTk2NWYxYzljYTVj"
    BLUEKSY_USERNAME=atproto-account@example.org
    BLUEKSY_PASSWORD=Averysecurepassword


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
[`.env` file]: https://www.dotenv.org/docs/security/env
[LICENSE-APACHE]: ./LICENSE-APACHE
[LICENSE-MIT]: ./LICENSE-MIT

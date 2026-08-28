/// <reference types="jest" />

// Timeout maior — cada teste bate no Postgres real (dedup usa similarity()/ST_DWithin), não mock.
jest.setTimeout(15000);
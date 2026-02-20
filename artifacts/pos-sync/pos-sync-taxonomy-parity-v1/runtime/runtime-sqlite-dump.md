# Runtime SQLite Dump

- Date/time (UTC): 2026-02-20T05:30:12Z
- DB path: /Users/enriquemoya/Library/Application Support/@pos/desktop/koyote.db

## categories distribution
```sql
SELECT COUNT(*) AS categories_total, SUM(CASE WHEN enabled_pos=1 THEN 1 ELSE 0 END) AS categories_enabled_pos, SUM(CASE WHEN enabled_pos=0 THEN 1 ELSE 0 END) AS categories_disabled_pos, SUM(CASE WHEN is_deleted_cloud=1 THEN 1 ELSE 0 END) AS categories_deleted FROM categories;
```
```text
1|1|0|0
```

## game_types and expansions counts
```text
1
1
```

## products and taxonomy references
```text
1|0|1
9b577ceb-53b9-498f-a531-fbfe0ff851ea|ETB Lucario|legacy:category:commodity|COMMODITY|db71a107-9f96-438f-b0ea-75a469037df4|Pokemon|acee86f3-725e-4381-adff-a211b4cf2aad|ETB Lucario
```

CREATE TABLE IF NOT EXISTS closed_positions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  exchange   VARCHAR(255) NULL,
  symbol     VARCHAR(255) NULL,
  side       VARCHAR(50)  NULL,
  amount     REAL         NULL,
  [entry]    REAL         NULL,
  profit     REAL         NULL,
  created_at INT          NULL,
  closed_at  INT          NULL
);

CREATE INDEX closed_positions_created_at_idx ON closed_positions (created_at);
CREATE INDEX closed_positions_symbol_created_at_idx ON closed_positions (symbol, created_at);

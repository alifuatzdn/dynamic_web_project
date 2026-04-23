-- FlyTicket synthetic flight seed (500 rows)
-- Range: 2026-04-23 to 2026-08-30 (at least one flight every day)
-- Rules satisfied:
-- 1) No duplicate (from_city, departure_time)
-- 2) No duplicate (to_city, arrival_time)

SET @start_date = '2026-04-23';
SET @end_date = '2026-08-30';
SET @day_count = DATEDIFF(@end_date, @start_date) + 1;
SET @city_count = (SELECT COUNT(*) FROM cities);

-- If cities table has fewer than 2 rows, no insert happens.
INSERT INTO flights (
  flight_number,
  from_city,
  to_city,
  departure_time,
  arrival_time,
  price,
  seats_total,
  seats_available,
  created_at,
  updated_at
)
WITH RECURSIVE seq AS (
  SELECT 0 AS n
  UNION ALL
  SELECT n + 1
  FROM seq
  WHERE n < 999
),
city_idx AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY id) - 1 AS idx
  FROM cities
),
flight_base AS (
  SELECT
    s.n,
    CONCAT('SYN', LPAD(s.n + 1, 4, '0')) AS flight_number,
    fc.id AS from_city,
    tc.id AS to_city,
    TIMESTAMP(
      DATE_ADD(@start_date, INTERVAL MOD(s.n, @day_count) DAY),
      SEC_TO_TIME((360 + MOD(s.n * 13, 960)) * 60)
    ) AS departure_time,
    CAST(850 + MOD(s.n * 37, 3400) AS DECIMAL(10,2)) AS price,
    120 + MOD(s.n * 9, 81) AS seats_total
  FROM seq s
  JOIN city_idx fc
    ON fc.idx = MOD(s.n * 7, @city_count)
  JOIN city_idx tc
    ON tc.idx = MOD(MOD(s.n * 7, @city_count) + 1 + MOD(s.n * 11, @city_count - 1), @city_count)
  WHERE @city_count >= 2
)
SELECT
  fb.flight_number,
  fb.from_city,
  fb.to_city,
  fb.departure_time,
  TIMESTAMPADD(MINUTE, 90, fb.departure_time) AS arrival_time,
  fb.price,
  fb.seats_total,
  fb.seats_total AS seats_available,
  NOW() AS created_at,
  NOW() AS updated_at
FROM flight_base fb;

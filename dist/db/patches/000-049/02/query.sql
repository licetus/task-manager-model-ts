--------------------------------
-- task schema and tables
--------------------------------

CREATE SCHEMA "task";

CREATE SEQUENCE "task".task_id_seq;

CREATE OR REPLACE FUNCTION "task".task_id
(OUT result bigint) AS $$
DECLARE
	our_epoch bigint := 1466352806721;
	seq_id bigint;
	now_millis bigint;
	shard_id int := 0;
BEGIN
  SELECT nextval('"task".task_id_seq') % 128
  INTO seq_id;
  SELECT FLOOR(EXTRACT(EPOCH FROM current_timestamp) * 1000)
  INTO now_millis;
  result :=
  (now_millis - our_epoch) << 12; 
result := result |
(shard_id << 7);
	result := result |
(seq_id);
END;
$$ LANGUAGE PLPGSQL;

CREATE TABLE "task".task
(
  id bigint DEFAULT "task".task_id() NOT NULL,
  is_completed boolean DEFAULT FALSE,
  title varchar NOT NULL,
  content varchar,
  deadline bigint,
  create_time bigint DEFAULT unix_now(),
  last_update_time bigint DEFAULT unix_now(),
  PRIMARY KEY (id)
)
WITH (
	OIDS=FALSE
);

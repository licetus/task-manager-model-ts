
--------------------------------
-- Extensions
--------------------------------

CREATE EXTENSION IF NOT EXISTS intarray;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

--------------------------------
-- Functions
--------------------------------

CREATE OR REPLACE FUNCTION unix_now()
	RETURNS bigint AS
$BODY$
BEGIN
	RETURN extract(epoch from current_timestamp(3)) * 1000;
END;
$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;

-- 更新last_updated字段的觸發器

CREATE OR REPLACE FUNCTION update_timestamp()
	RETURNS trigger AS
$BODY$
BEGIN
	NEW.last_updated = unix_now();
	RETURN NEW;
END;
$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;

--------------------------------

-- 指定长度的随机字符串

CREATE OR REPLACE FUNCTION random_string(length integer)
RETURNS text AS
$$
DECLARE
	chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}';
	result text := '';
	i integer := 0;
BEGIN
	IF length < 0 THEN
		RAISE EXCEPTION 'Given length cannot be less than 0';
	END IF;
	for i in 1..length LOOP
		result := result || chars[1+random()*(array_length(chars, 1)-1)];
	END LOOP;
	RETURN result;
END;
$$ language plpgsql;

--------------------------------

CREATE OR REPLACE FUNCTION geo_distance_km(c1 point, c2 point)
RETURNS integer AS
$$
BEGIN
		RETURN ((c1 <@> c2) * 1.609344)::int;
END;
$$
language plpgsql
;

--------------------------------

CREATE OR REPLACE FUNCTION update_token()
	RETURNS trigger AS
$BODY$
BEGIN
	NEW.token = random_string(10);
	RETURN NEW;
END;
$BODY$
	LANGUAGE plpgsql VOLATILE
	COST 100;

--------------------------------

CREATE FUNCTION jsonb_merge(JSONB, JSONB)
RETURNS JSONB AS $$
WITH json_union AS (
		SELECT * FROM JSONB_EACH($1)
		UNION ALL
		SELECT * FROM JSONB_EACH($2)
) SELECT JSON_OBJECT_AGG(key, value)::JSONB
		 FROM json_union
		 WHERE key NOT IN (SELECT key FROM json_union WHERE value ='null');
$$ LANGUAGE SQL
;

--------------------------------

CREATE OR REPLACE FUNCTION array_intersect(a1 varchar[], a2 varchar[])
RETURNS varchar[] AS
$$
DECLARE
		ret varchar[];
BEGIN
		IF a1 IS NULL THEN
				RETURN null;
		ELSEIF a2 IS NULL THEN
				RETURN null;
		END IF;
		SELECT array_agg(e) INTO ret
		FROM (
				SELECT unnest(a1)
				INTERSECT
				SELECT unnest(a2)
		) AS dt(e);
		RETURN ret;
END;
$$ language plpgsql;

--------------------------------

-- Tables

-- 數據庫版本表

CREATE SEQUENCE version_id_seq;

CREATE OR REPLACE FUNCTION version_id(OUT result bigint) AS $$
DECLARE
		our_epoch bigint := 1466352806721;
		seq_id bigint;
		now_millis bigint;
		shard_id int := 0;
BEGIN
		SELECT nextval('version_id_seq') % 128 INTO seq_id;

		SELECT FLOOR(EXTRACT(EPOCH FROM current_timestamp) * 1000) INTO now_millis;
		result := (now_millis - our_epoch) << 12;
		result := result | (shard_id << 7);
		result := result | (seq_id);
END;
$$ LANGUAGE PLPGSQL;

CREATE TABLE version
(
	id bigint DEFAULT version_id() NOT NULL,
	ver int NOT NULL,
	created bigint DEFAULT unix_now(),
	last_updated bigint DEFAULT unix_now(),
	PRIMARY KEY (id)
)
WITH (
	OIDS=FALSE
);

CREATE TRIGGER last_updated
	BEFORE UPDATE
	ON version
	FOR EACH ROW
	EXECUTE PROCEDURE update_timestamp();

--------------------------------

CREATE SEQUENCE cache_id_seq;

CREATE OR REPLACE FUNCTION cache_id(OUT result bigint) AS $$
DECLARE
		our_epoch bigint := 1466352806721;
		seq_id bigint;
		now_millis bigint;
		shard_id int := 0;
BEGIN
		SELECT nextval('cache_id_seq') % 128 INTO seq_id;

		SELECT FLOOR(EXTRACT(EPOCH FROM current_timestamp) * 1000) INTO now_millis;
		result := (now_millis - our_epoch) << 12;
		result := result | (shard_id << 7);
		result := result | (seq_id);
END;
$$ LANGUAGE PLPGSQL;

CREATE TABLE cache
(
	id bigint DEFAULT cache_id() NOT NULL,
	key varchar,
	value jsonb,
	is_str boolean DEFAULT false,
	time bigint DEFAULT unix_now(),
	created bigint DEFAULT unix_now(),
	last_updated bigint DEFAULT unix_now(),
	PRIMARY KEY (id)
)
WITH (
	OIDS=FALSE
);

CREATE TRIGGER last_updated
	BEFORE UPDATE
	ON cache
	FOR EACH ROW
	EXECUTE PROCEDURE update_timestamp();

--------------------------------

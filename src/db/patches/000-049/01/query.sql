--------------------------------
-- role schema and tables
--------------------------------

CREATE SCHEMA "role";

--------------------------------
-- Create admin role table

CREATE TABLE "role".role
(
  id bigint NOT NULL,
  role varchar NOT NULL,
  CONSTRAINT role_pkey PRIMARY KEY (id)
)
WITH (
	OIDS = FALSE
);

INSERT INTO "role".role
  (id, role)
VALUES
  (1, 'Superadmin'),
  (2, 'Admin');

--------------------------------
-- static schema and tables
--------------------------------

CREATE OR REPLACE FUNCTION calc_total_interest
(principal double precision, interest_rate double precision, term_type int)
RETURNS double precision AS
$BODY$
BEGIN
  IF term_type = 1 THEN
  RETURN principal * interest_rate * 7 / 365;
  ELSIF term_type = 2 THEN
  RETURN principal * interest_rate * 1 / 12;
  ELSIF term_type = 3 THEN
  RETURN principal * interest_rate * 3 / 12;
  ELSIF term_type = 4 THEN
  RETURN principal * interest_rate * 6 / 12;
  ELSE
  RETURN 0;
END
IF;
END;
$BODY$
LANGUAGE plpgsql;

-- INSERT notification via service_role (Edge sos-dispatch) : nécessite USAGE sur la séquence de id
grant usage, select on sequence public.notification_id_seq to service_role;

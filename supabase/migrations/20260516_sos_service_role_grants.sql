-- =====================================================
-- SOS : droits service_role pour la Edge Function sos-dispatch
-- (20260515 n'accordait que authenticated → permission denied côté Edge.)
-- =====================================================

grant select, insert on public.sos_event to service_role;
grant select on public.contact_urgence to service_role;
grant insert on public.notification to service_role;

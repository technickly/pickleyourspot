-- Delete all messages first (they reference reservations)
DELETE FROM "Message";

-- Delete all participant statuses
DELETE FROM "ParticipantStatus";

-- Finally, delete all reservations
DELETE FROM "Reservation";

-- Optional: Reset the sequence for reservation IDs
ALTER SEQUENCE "Reservation_id_seq" RESTART WITH 1; 
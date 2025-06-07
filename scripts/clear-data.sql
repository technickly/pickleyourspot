-- Delete in order of dependencies to handle foreign key constraints

-- First, delete messages (they reference both users and reservations)
DELETE FROM "Message";

-- Delete participant statuses (references both users and reservations)
DELETE FROM "ParticipantStatus";

-- Delete reservations (references users)
DELETE FROM "Reservation";

-- Finally, delete users
DELETE FROM "User";

-- Reset sequences
ALTER SEQUENCE "Message_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ParticipantStatus_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Reservation_id_seq" RESTART WITH 1;
ALTER SEQUENCE "User_id_seq" RESTART WITH 1;

-- Verify courts remain
SELECT COUNT(*) as remaining_courts FROM "Court"; 
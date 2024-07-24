-- This file should undo anything in `up.sql`
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_unique_message_id;

DROP index IF EXISTS idx_messages_message_id;
CREATE index idx_messages_message_id
    ON messages (message_id);

DROP INDEX messages_assignment_id_key;

CREATE UNIQUE INDEX messages_assignment_id_key
    ON messages (assignment_id);

ALTER TABLE messages
    ADD CONSTRAINT messages_unique_assignment_id
        UNIQUE USING INDEX messages_assignment_id_key;
ALTER TABLE public.messages
  ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN media_url TEXT;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'gif'));

ALTER TABLE public.messages
  ADD CONSTRAINT messages_payload_check
  CHECK (
    (message_type = 'text' AND length(btrim(body)) BETWEEN 1 AND 500 AND media_url IS NULL)
    OR
    (message_type = 'gif' AND media_url IS NOT NULL AND media_url ~ '^https://')
  ) NOT VALID;

COMMENT ON COLUMN public.messages.message_type IS 'Distinguishes ordinary text messages from GIF messages.';
COMMENT ON COLUMN public.messages.media_url IS 'HTTPS media URL for GIF messages; null for text.';
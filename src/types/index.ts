export interface Message {
  id: string;
  from_number: string;
  to_number: string;
  body: string;
  message_sid: string;
  created_at: string;
  is_deleted?: boolean;
}

update public.contact_channels
set
  label = 'Chat trực tiếp với admin',
  contact_value = 'Trao đổi ngay trên website',
  target_url = '',
  is_active = true,
  updated_at = now()
where id = 'internal_chat';

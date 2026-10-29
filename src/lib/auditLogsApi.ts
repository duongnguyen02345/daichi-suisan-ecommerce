import { supabase } from './supabase';
import { AdminAuditLog } from '../types';

interface AuditLogDbRow {
  id: number;
  admin_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}

export const fetchAuditLogs = async (limit: number = 100): Promise<AdminAuditLog[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Tải nhật ký kiểm toán thất bại: ${error.message}`);
  }

  return (data || []).map((row: AuditLogDbRow) => ({
    id: row.id,
    adminUserId: row.admin_user_id || undefined,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldData: row.old_data || undefined,
    newData: row.new_data || undefined,
    createdAt: row.created_at,
  }));
};

export const recordAuditLog = async (params: {
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
}): Promise<void> => {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user?.id || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      old_data: params.oldData || null,
      new_data: params.newData || null,
    });
  } catch (err) {
    // Non-blocking log recording
    console.warn('Failed to record audit log:', err);
  }
};

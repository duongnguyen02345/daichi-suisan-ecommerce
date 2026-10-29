import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  FileCode,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { AdminAuditLog } from '../../types';
import { fetchAuditLogs } from '../../lib/auditLogsApi';

export const AuditLogsSection: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const [inspectingLog, setInspectingLog] = useState<AdminAuditLog | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(150);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải nhật ký hoạt động.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [logs]);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.entityType));
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.entityId.toLowerCase().includes(search.toLowerCase()) ||
        log.entityType.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.adminUserId && log.adminUserId.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;

      return true;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('INSERT') || act.includes('CREATE') || act.includes('ADD')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('ADJUST')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('DELETE') || act.includes('ARCHIVE') || act.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#0E7A32]" />
            Nhật ký hoạt động quản trị (Audit Logs)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ghi vết mọi thao tác thay đổi dữ liệu sản phẩm, đơn hàng, tồn kho, banner và cấu hình website.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="h-10 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[16px] border border-gray-200 p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 font-medium bg-gray-50 focus:ring-2 focus:ring-[#0E7A32]"
          >
            <option value="all">Tất cả hành động ({logs.length})</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 font-medium bg-gray-50 focus:ring-2 focus:ring-[#0E7A32]"
          >
            <option value="all">Tất cả bảng dữ liệu</option>
            {entityTypes.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo ID, đối tượng, hành động..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7A32]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0E7A32]" />
            Đang tải nhật ký kiểm toán...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Chưa có ghi nhận thao tác nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Hành động</th>
                  <th className="px-5 py-3.5">Đối tượng &amp; Bản ghi</th>
                  <th className="px-5 py-3.5">Tài khoản thực hiện</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => {
                  return (
                    <tr key={String(log.id)} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[10px] border ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900">{log.entityType}</div>
                        <div className="text-[11px] font-mono text-gray-400 mt-0.5 max-w-xs truncate">
                          ID: {log.entityId}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-gray-600">
                        {log.adminUserId ? (
                          <div className="font-mono text-[11px] text-gray-700 truncate max-w-xs">
                            {log.adminUserId}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Hệ thống tự động / DB Trigger</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {(log.oldData || log.newData) ? (
                          <button
                            type="button"
                            onClick={() => setInspectingLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-[#0E7A32] hover:text-[#0E7A32] text-gray-600 font-bold text-[11px] transition shadow-2xs"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>So sánh JSON</span>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Diff Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative animate-fadeIn max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-none">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#0E7A32]" />
                Chi tiết thay đổi bản ghi: {inspectingLog.entityType} ({inspectingLog.entityId})
              </h3>
              <button
                onClick={() => setInspectingLog(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Data */}
                <div>
                  <div className="font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-t-lg border border-rose-200 flex items-center justify-between">
                    <span>Dữ liệu cũ (Trước khi sửa)</span>
                    <span className="text-[10px] font-normal">old_data</span>
                  </div>
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded-b-lg overflow-x-auto max-h-80 text-[11px] leading-relaxed">
                    {inspectingLog.oldData
                      ? JSON.stringify(inspectingLog.oldData, null, 2)
                      : '// Không có dữ liệu cũ (Tạo mới)'}
                  </pre>
                </div>

                {/* New Data */}
                <div>
                  <div className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-t-lg border border-emerald-200 flex items-center justify-between">
                    <span>Dữ liệu mới (Sau khi sửa)</span>
                    <span className="text-[10px] font-normal">new_data</span>
                  </div>
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded-b-lg overflow-x-auto max-h-80 text-[11px] leading-relaxed">
                    {inspectingLog.newData
                      ? JSON.stringify(inspectingLog.newData, null, 2)
                      : '// Không có dữ liệu mới (Xóa)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end flex-none">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

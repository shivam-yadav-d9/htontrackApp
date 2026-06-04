import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  Ticket,
  TicketCommentPayload,
  TicketCreatePayload,
  TicketStatusUpdatePayload,
} from '@/types/ticket.types';
import { storage } from '@/utils/storage';

export type { Ticket, TicketCreatePayload };

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const ticketService = {
  async getMyTickets(): Promise<Ticket[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const rows = await localDb.getCollection<Ticket & { raised_by?: string }>('tickets');
      return rows.filter((t) => t.raised_by === uid);
    }
    return api.get<Ticket[]>('/staff/tickets/my');
  },

  async createTicket(payload: TicketCreatePayload): Promise<Ticket> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Ticket = {
        id: localDb.generateId('ticket'),
        raised_by: uid,
        status: 'open',
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payload,
      } as unknown as Ticket;
      return localDb.addItem('tickets', item);
    }
    return api.post<Ticket>('/staff/tickets', payload);
  },

  async getManagerTickets(): Promise<Ticket[]> {
    if (APP_MODE === 'offline_apk') {
      return localDb.getCollection<Ticket>('tickets');
    }
    return api.get<Ticket[]>('/manager/tickets');
  },

  async updateTicketStatus(id: string, payload: TicketStatusUpdatePayload): Promise<Ticket> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<Ticket>('tickets', id, { status: payload.status });
      return updated!;
    }
    return api.post<Ticket>(`/manager/tickets/${id}/status`, payload);
  },

  async addComment(id: string, payload: TicketCommentPayload): Promise<Ticket> {
    if (APP_MODE === 'offline_apk') {
      const ticket = await localDb.findById<Ticket & { comments?: unknown[] }>('tickets', id);
      if (!ticket) throw new Error('Ticket not found');
      const comments = [...(ticket.comments ?? []), { id: localDb.generateId('cmt'), text: payload.comment, created_at: new Date().toISOString() }];
      const updated = await localDb.updateItem<Ticket>('tickets', id, { comments } as Partial<Ticket>);
      return updated!;
    }
    return api.post<Ticket>(`/tickets/${id}/comments`, payload);
  },

  async getTicket(id: string): Promise<Ticket> {
    if (APP_MODE === 'offline_apk') {
      const item = await localDb.findById<Ticket>('tickets', id);
      if (!item) throw new Error('Ticket not found');
      return item;
    }
    return api.get<Ticket>(`/tickets/${id}`);
  },
};

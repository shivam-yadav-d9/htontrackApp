import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import type {
  Certificate,
  CertificateCreatePayload,
  LeaderboardRow,
  Reward,
  RewardCreatePayload,
  RewardSummary,
} from '@/types/reward.types';
import { storage } from '@/utils/storage';

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

function buildRewardSummary(rewards: Reward[]): RewardSummary {
  return {
    total_rewards: rewards.length,
    total_points: rewards.reduce((s, r) => s + (r.points ?? 0), 0),
    badges: rewards.filter((r) => r.reward_type === 'badge').length,
    appreciations: rewards.filter((r) => r.reward_type === 'appreciation').length,
  };
}

export const rewardService = {
  async createReward(payload: RewardCreatePayload): Promise<Reward> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Reward = {
        id: localDb.generateId('reward'),
        awarded_by: uid,
        awarded_at: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as Reward;
      return localDb.addItem('rewards', item);
    }
    return api.post<Reward>('/manager/rewards', payload);
  },

  async getManagerRewards(): Promise<{ summary: RewardSummary; rewards: Reward[] }> {
    if (APP_MODE === 'offline_apk') {
      const rewards = await localDb.getCollection<Reward>('rewards');
      return { summary: buildRewardSummary(rewards), rewards };
    }
    return api.get<{ summary: RewardSummary; rewards: Reward[] }>('/manager/rewards');
  },

  async getMyRewards(): Promise<{ summary: RewardSummary; rewards: Reward[] }> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const all = await localDb.getCollection<Reward & { staff_id: string }>('rewards');
      const rewards = all.filter((r) => r.staff_id === uid) as unknown as Reward[];
      return { summary: buildRewardSummary(rewards), rewards };
    }
    return api.get<{ summary: RewardSummary; rewards: Reward[] }>('/staff/rewards/my');
  },

  async createCertificate(payload: CertificateCreatePayload): Promise<Certificate> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Certificate = {
        id: localDb.generateId('cert'),
        certificate_number: `HT-CERT-${Date.now()}`,
        issued_by: uid,
        issued_at: new Date().toISOString(),
        verification_status: 'valid',
        status: 'active',
        created_at: new Date().toISOString(),
        ...payload,
      } as unknown as Certificate;
      return localDb.addItem('certificates', item);
    }
    return api.post<Certificate>('/manager/certificates', payload);
  },

  async getManagerCertificates() {
    if (APP_MODE === 'offline_apk') {
      const certificates = await localDb.getCollection<Certificate>('certificates');
      const total = certificates.length;
      const courseCompletion = certificates.filter((c) => c.certificate_type === 'Course Completion').length;
      const skillExcellence = certificates.filter((c) => c.certificate_type === 'Skill Excellence').length;
      const targetChampion = certificates.filter((c) => c.certificate_type === 'Target Champion').length;
      return { summary: { total_certificates: total, course_completion: courseCompletion, skill_excellence: skillExcellence, target_champion: targetChampion }, certificates };
    }
    return api.get<{ summary: { total_certificates: number; course_completion: number; skill_excellence: number; target_champion: number }; certificates: Certificate[] }>('/manager/certificates');
  },

  async getMyCertificates(): Promise<Certificate[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const all = await localDb.getCollection<Certificate & { staff_id: string }>('certificates');
      return all.filter((c) => c.staff_id === uid) as unknown as Certificate[];
    }
    return api.get<Certificate[]>('/staff/certificates/my');
  },

  async getManagerLeaderboard(): Promise<{ leaderboard: LeaderboardRow[]; top_performer: LeaderboardRow | null }> {
    if (APP_MODE === 'offline_apk') {
      const users = await localDb.getCollection<{ id: string; full_name: string; employee_code?: string; store_code?: string; store_name?: string }>('users');
      const rewards = await localDb.getCollection<Reward & { staff_id: string }>('rewards');
      const certs = await localDb.getCollection<Certificate & { staff_id: string }>('certificates');
      const leaderboard: LeaderboardRow[] = users
        .filter((u) => (u as unknown as { role: string }).role === 'STAFF')
        .map((u, i) => {
          const myRewards = rewards.filter((r) => r.staff_id === u.id);
          const myCerts = certs.filter((c) => c.staff_id === u.id);
          const pts = myRewards.reduce((s, r) => s + ((r as unknown as { points?: number }).points ?? 0), 0);
          return {
            staff_id: u.id, staff_name: u.full_name, employee_code: u.employee_code,
            store_code: u.store_code, store_name: u.store_name,
            reward_points: pts, total_score: pts + myCerts.length * 50,
            certificate_count: myCerts.length, reward_count: myRewards.length,
            rank: i + 1, level: pts >= 300 ? 'Gold' : pts >= 150 ? 'Silver' : 'Bronze',
            quiz_points: 0, course_points: 0, skill_points: 0, checklist_points: 0,
            coaching_points: 0, attendance_points: 0, target_points: 0, certificate_points: myCerts.length * 50,
          } as LeaderboardRow;
        })
        .sort((a, b) => b.total_score - a.total_score)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      return { leaderboard, top_performer: leaderboard[0] ?? null };
    }
    return api.get<{ leaderboard: LeaderboardRow[]; top_performer: LeaderboardRow | null }>('/manager/leaderboard');
  },

  async getStaffLeaderboard(): Promise<{ leaderboard: LeaderboardRow[]; my_rank: LeaderboardRow | null }> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const { leaderboard } = await rewardService.getManagerLeaderboard();
      const marked = leaderboard.map((r) => ({ ...r, is_me: r.staff_id === uid }));
      const myRank = marked.find((r) => r.is_me) ?? null;
      return { leaderboard: marked, my_rank: myRank };
    }
    return api.get<{ leaderboard: LeaderboardRow[]; my_rank: LeaderboardRow | null }>('/staff/leaderboard');
  },
};
